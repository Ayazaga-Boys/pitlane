import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminReportByIdOrMock } from "@/lib/admin-data";
import { getAdminIdentity } from "@/lib/auth";
import { mockReports } from "@/lib/mock-data";
import { banReportedUser, deleteReportedContent, dismissReportAction, suspendReportedUser, warnReportedUser } from "./actions";

function contentTypeLabel(contentType: string) {
  switch (contentType) {
    case "message":
      return "Mesaj";
    case "flare":
      return "Flare";
    case "community":
      return "Topluluk";
    case "business_pin":
      return "İşletme pini";
    case "profile":
      return "Profil";
    default:
      return "İçerik";
  }
}

function previewTone(contentType: string) {
  if (contentType === "message") {
    return "message";
  }

  if (contentType === "flare") {
    return "flare";
  }

  return "default";
}

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { result?: string };
}) {
  const identity = await getAdminIdentity();
  const { data: detail, usingMockData } = await getAdminReportByIdOrMock(params.id, mockReports);

  if (!detail) {
    notFound();
  }

  const deleteAction = deleteReportedContent.bind(null, params.id);
  const warnAction = warnReportedUser.bind(null, params.id);
  const suspendAction = suspendReportedUser.bind(null, params.id);
  const banAction = banReportedUser.bind(null, params.id);
  const dismissAction = dismissReportAction.bind(null, params.id);
  const contentTone = previewTone(detail.contentType);
  const isModerator = identity.role === "moderator";

  return (
    <PageShell
      eyebrow="Sprint 3 hazırlık"
      title="Şikayet detayı"
      description="Tekil şikayet kaydını inceleyip içerik silme, uyarı veya kullanıcı moderasyonu aksiyonlarını tek ekrandan yürüt."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href="/reports"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Şikayet listesine dön
      </Link>

      {searchParams?.result ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.result === "content_deleted"
            ? "Şikayet edilen içerik aksiyonu uygulandı."
            : searchParams.result === "warned"
              ? "Kullanıcıya sistem uyarısı gönderildi."
              : searchParams.result === "suspended"
                ? "Kullanıcı 7 gün askıya alındı."
                : searchParams.result === "banned"
                  ? "Kullanıcı kalıcı olarak banlandı."
                  : "Şikayet kaydı kapatıldı."}
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Şikayet detayı için gerçek veri okunamadı; örnek moderasyon akışı gösteriliyor."
        liveLabel="Gerçek şikayet kaydı açık. Aşağıdaki aksiyonlar doğrudan Supabase üzerinde çalışır."
      />

      <section className="surface-panel p-xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-md">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-pit-red-soft">Moderasyon kuyruğu</p>
              <h2 className="mt-xs text-2xl font-semibold text-text-primary">{detail.report.reason}</h2>
              <p className="mt-sm max-w-2xl text-sm leading-6 text-text-secondary">
                {detail.description ?? "Rapor sahibi ek açıklama bırakmamış. İçerik önizlemesi ve geçmiş moderasyon kayıtları üzerinden karar ver."}
              </p>
            </div>

            <div className="flex flex-wrap gap-sm">
              <Badge tone={detail.report.severity === "high" ? "error" : detail.report.severity === "medium" ? "warning" : "info"}>
                {detail.report.severity === "high" ? "yüksek" : detail.report.severity === "medium" ? "orta" : "düşük"}
              </Badge>
              <Badge tone={detail.status === "pending" ? "warning" : "success"}>
                {detail.status === "pending" ? "bekliyor" : detail.status === "dismissed" ? "reddedildi" : "inceleme tamamlandı"}
              </Badge>
              <Badge tone="default">{contentTypeLabel(detail.contentType)}</Badge>
            </div>
          </div>

          <div className="grid gap-md rounded-md border border-surface-3 bg-surface-2 p-lg sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Bildiren</p>
              <p className="mt-xs text-sm text-text-primary">{detail.reporterLabel}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Hedef kullanıcı</p>
              <p className="mt-xs text-sm text-text-primary">{detail.targetLabel}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Şikayet zamanı</p>
              <p className="mt-xs text-sm text-text-primary">{detail.report.createdAt}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Son aksiyon</p>
              <p className="mt-xs text-sm text-text-primary">{detail.actionTaken ?? "none"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-lg xl:grid-cols-[1fr_0.92fr]">
        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">İçerik önizleme</h3>
          <div className="mt-lg rounded-md border border-surface-3 bg-surface-2 p-lg">
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">{detail.contentPreviewTitle}</p>

            {contentTone === "message" ? (
              <div className="mt-md max-w-2xl rounded-2xl rounded-bl-sm border border-error/30 bg-error/10 px-lg py-md shadow-[0_12px_30px_rgba(244,63,94,0.12)]">
                <div className="flex items-center justify-between gap-md">
                  <p className="text-sm font-semibold text-text-primary">{detail.targetLabel}</p>
                  <span className="text-xs uppercase tracking-[0.16em] text-error">Raporlanan mesaj</span>
                </div>
                <p className="mt-sm text-sm leading-7 text-text-primary">{detail.contentPreviewBody}</p>
              </div>
            ) : contentTone === "flare" ? (
              <div className="mt-md rounded-xl border border-info/25 bg-info/10 p-lg">
                <p className="text-sm font-semibold text-text-primary">{detail.targetLabel}</p>
                <p className="mt-sm text-sm leading-6 text-text-primary">{detail.contentPreviewBody}</p>
              </div>
            ) : (
              <p className="mt-md text-sm leading-6 text-text-primary">{detail.contentPreviewBody}</p>
            )}
          </div>

          <div className="mt-lg rounded-md border border-surface-3 bg-surface-2 p-lg">
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Severity matrix önerisi</p>
            <div className="mt-sm flex flex-wrap items-center gap-sm">
              <p className="text-sm font-semibold text-text-primary">{detail.severityRecommendation.title}</p>
              <Badge
                tone={
                  detail.severityRecommendation.tone === "error"
                    ? "error"
                    : detail.severityRecommendation.tone === "warning"
                      ? "warning"
                      : "info"
                }
              >
                skor {detail.severityRecommendation.score}/100
              </Badge>
            </div>
            <p className="mt-sm text-sm leading-6 text-text-secondary">{detail.severityRecommendation.description}</p>
            <p className="mt-md text-sm font-medium text-text-primary">
              Önerilen aksiyon: {detail.severityRecommendation.recommendedAction}
            </p>
            <ul className="mt-md space-y-sm text-sm leading-6 text-text-secondary">
              {detail.severityRecommendation.signals.map((signal) => (
                <li key={signal} className="flex items-start gap-sm">
                  <span aria-hidden="true" className="mt-2 size-1.5 rounded-full bg-pit-red" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Moderasyon aksiyonları</h3>
          <p className="mt-md text-sm leading-6 text-text-secondary">
            İçerik silme, uyarı ve kullanıcı moderasyonu buradan uygulanır. Her aksiyon ilgili audit kaydını bırakır.
          </p>

          <div className="mt-lg grid gap-md">
            <form action={deleteAction}>
              <Button className="w-full" disabled={usingMockData || detail.status !== "pending"} type="submit" variant="secondary">
                İçeriği sil
              </Button>
            </form>
            <form action={warnAction}>
              <Button className="w-full" disabled={usingMockData || !detail.targetUserId || detail.status !== "pending"} type="submit">
                Kullanıcıyı uyar
              </Button>
            </form>
            <form action={suspendAction}>
              <Button
                className="w-full"
                disabled={usingMockData || !detail.targetUserId || detail.status !== "pending" || isModerator}
                type="submit"
                variant="secondary"
              >
                7 gün suspend
              </Button>
            </form>
            <form action={banAction}>
              <Button
                className="w-full"
                disabled={usingMockData || !detail.targetUserId || detail.status !== "pending" || isModerator}
                type="submit"
                variant="destructive"
              >
                Kalıcı ban
              </Button>
            </form>
            <form action={dismissAction}>
              <Button className="w-full" disabled={usingMockData || detail.status !== "pending"} type="submit" variant="ghost">
                Şikayeti geçersiz say
              </Button>
            </form>

            {isModerator ? (
              <div className="rounded-md border border-warning/30 bg-warning/10 p-md text-sm leading-6 text-text-primary">
                Moderatör rolü içerik silme, uyarı ve şikayet kapatma aksiyonlarını kullanabilir. Askıya alma ve kalıcı ban
                admin onayı gerektirir.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
