import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { getAdminStatusPageOrMock } from "@/lib/admin-data";
import { mockStatusPage } from "@/lib/mock-data";
import { updateStatusPageState } from "./actions";

function statusTone(status: "operational" | "degraded" | "partial_outage" | "major_outage") {
  switch (status) {
    case "operational":
      return "success" as const;
    case "degraded":
      return "warning" as const;
    case "partial_outage":
      return "info" as const;
    case "major_outage":
      return "error" as const;
  }
}

function statusLabel(status: "operational" | "degraded" | "partial_outage" | "major_outage") {
  switch (status) {
    case "operational":
      return "Operasyonel";
    case "degraded":
      return "Yavaşlama var";
    case "partial_outage":
      return "Kısmi kesinti";
    case "major_outage":
      return "Büyük kesinti";
  }
}

function phaseLabel(phase: "investigating" | "identified" | "monitoring" | "resolved") {
  switch (phase) {
    case "investigating":
      return "İnceleniyor";
    case "identified":
      return "Kaynak bulundu";
    case "monitoring":
      return "İzleniyor";
    case "resolved":
      return "Çözüldü";
  }
}

function readinessTone(status: "ready" | "partial" | "blocked") {
  switch (status) {
    case "ready":
      return "success" as const;
    case "partial":
      return "warning" as const;
    case "blocked":
      return "error" as const;
  }
}

function readinessLabel(status: "ready" | "partial" | "blocked") {
  switch (status) {
    case "ready":
      return "Hazır";
    case "partial":
      return "Kısmi hazır";
    case "blocked":
      return "Backend bekliyor";
  }
}

type ReadinessState = "ready" | "partial" | "blocked";

interface ReadinessItem {
  key: string;
  title: string;
  status: ReadinessState;
  route: string;
  summary: string;
  nextStep: string;
}

export default async function StatusPage({
  searchParams,
}: {
  searchParams?: { result?: string; message?: string };
}) {
  const { data: statusPage, usingMockData } = await getAdminStatusPageOrMock(mockStatusPage);
  const readinessItems: ReadinessItem[] = [
    {
      key: "business_documents",
      title: "Business belge preview",
      status: "blocked" as const,
      route: "/business/applications",
      summary: "Signed URL preview kontrati henuz acik degil. Admin tarafta metadata ve storage key ile kontrol devam ediyor.",
      nextStep: "Backend signed preview geldiginde belge kartlarina dogrudan onizleme butonu baglanacak.",
    },
    {
      key: "post_auto_flag",
      title: "Cloudflare media auto-flag",
      status: "blocked" as const,
      route: "/posts",
      summary: "NSFW / violence skorlari henuz admin moderasyon kuyruğuna baglanmadi. Su an manuel rapor ve moderator aksiyonlari calisiyor.",
      nextStep: "Backend moderation sinyali geldiginde raporlu post ozetine otomatik risk rozeti eklenecek.",
    },
    {
      key: "competitions",
      title: "Competitions backend kontrati",
      status: "partial" as const,
      route: "/competitions",
      summary: "Liste, risk sirasi ve admin override audit tabanli calisiyor; gercek entry ve vote verisi halen eksik.",
      nextStep: "Community bazli yarışma endpoint'leri geldiginde mock katman cikarilip detay gerçek veriye tasinacak.",
    },
    {
      key: "community_needs",
      title: "Community needs spam enforcement",
      status: "partial" as const,
      route: "/community-needs",
      summary: "24 saatlik spam sinyali ve panelden suspend aksiyonu hazir. Tam otomatik server-side enforcement henuz yok.",
      nextStep: "Backend koruma kurali geldiginde bu sinyal otomatik blok veya cooldown akisina baglanacak.",
    },
  ];

  return (
    <PageShell
      eyebrow="Sprint 5 hazırlık"
      title="Durum sayfası"
      description="Public status sayfasına çıkacak incident dili ve servis sağlık durumu buradan manuel güncellenir."
    >
      {searchParams?.result === "updated" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.message ?? "Durum sayfası güncellendi."}
        </div>
      ) : null}

      {searchParams?.result === "error" ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.message ?? "Durum sayfası kaydedilemedi."}
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek durum yapılandırması okunamadı; ekran runbook örnekleriyle test modunda."
        liveLabel="Durum sayfası girdileri canlı yapılandırmadan okunuyor."
      />

      <div className="grid gap-lg xl:grid-cols-[0.92fr_1.08fr]">
        <section className="surface-panel p-xl xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-md">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Admin readiness panosu</h2>
              <p className="mt-sm text-sm leading-6 text-text-secondary">
                Backend bagimli kalan V2 alanlari burada tek bakista izlenir. Bu pano panel tarafinda neyin hazir, neyin kismi,
                neyin tamamen backend kontrati bekledigini netlestirir.
              </p>
            </div>
            <div className="flex flex-wrap gap-sm">
              <Badge tone="success">{readinessItems.filter((item) => item.status === "ready").length} hazir</Badge>
              <Badge tone="warning">{readinessItems.filter((item) => item.status === "partial").length} kismi</Badge>
              <Badge tone="error">{readinessItems.filter((item) => item.status === "blocked").length} beklemede</Badge>
            </div>
          </div>

          <div className="mt-lg grid gap-md lg:grid-cols-2">
            {readinessItems.map((item) => (
              <article key={item.key} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <div className="flex flex-wrap items-center justify-between gap-sm">
                  <h3 className="font-medium text-text-primary">{item.title}</h3>
                  <Badge tone={readinessTone(item.status)}>{readinessLabel(item.status)}</Badge>
                </div>
                <p className="mt-md text-sm leading-6 text-text-secondary">{item.summary}</p>
                <p className="mt-md text-sm leading-6 text-text-primary">{item.nextStep}</p>
                <Link
                  className="focus-ring mt-md inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-md py-sm text-sm font-semibold text-text-primary"
                  href={item.route}
                >
                  İlgili ekrana git
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-panel p-xl">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Canlı durum özeti</h2>
              <p className="mt-sm text-sm leading-6 text-text-secondary">
                Public durum sayfasında kullanıcıların göreceği son incident dili ve bileşen sağlığı burada özetlenir.
              </p>
            </div>
            <Badge tone={statusPage.incident.phase === "resolved" ? "success" : "warning"}>
              {phaseLabel(statusPage.incident.phase)}
            </Badge>
          </div>

          <div className="mt-lg rounded-md border border-surface-3 bg-surface-2 p-lg">
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Public adres</p>
            <p className="mt-sm text-sm text-text-primary">{statusPage.publicUrl}</p>
            <p className="mt-md text-xs uppercase tracking-[0.16em] text-text-tertiary">Son durum notu</p>
            <p className="mt-sm text-sm leading-6 text-text-primary">{statusPage.incident.message}</p>
            <p className="mt-md text-xs uppercase tracking-[0.16em] text-text-tertiary">
              Son güncelleme: {statusPage.incident.updatedAt}
            </p>
          </div>

          <div className="mt-lg grid gap-md md:grid-cols-2">
            {statusPage.components.map((component) => (
              <article key={component.key} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <div className="flex items-center justify-between gap-sm">
                  <h3 className="font-medium text-text-primary">{component.label}</h3>
                  <Badge tone={statusTone(component.status)}>{statusLabel(component.status)}</Badge>
                </div>
                <p className="mt-sm text-sm leading-6 text-text-secondary">{component.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Manuel incident güncellemesi</h2>
          <p className="mt-sm text-sm leading-6 text-text-secondary">
            Runbook’taki akışa göre önce durumu yaz, sonra incident fazını seç. Kaydettiğinde public durum metni ve bileşen
            rozetleri aynı anda güncellenir.
          </p>

          <form action={updateStatusPageState} className="mt-lg space-y-lg">
            <label className="space-y-sm block">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Public durum adresi</span>
              <input
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue={statusPage.publicUrl}
                name="publicUrl"
                type="text"
              />
            </label>

            <div className="grid gap-md md:grid-cols-2">
              <label className="space-y-sm block">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Incident fazı</span>
                <select
                  className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  defaultValue={statusPage.incident.phase}
                  name="phase"
                >
                  <option value="investigating">İnceleniyor</option>
                  <option value="identified">Kaynak bulundu</option>
                  <option value="monitoring">İzleniyor</option>
                  <option value="resolved">Çözüldü</option>
                </select>
              </label>
              <div className="rounded-md border border-info/25 bg-info/10 p-md text-sm leading-6 text-text-primary">
                Runbook notu: health check bozulursa ilk faz genelde <strong>İnceleniyor</strong>, düzeltme sonrası son faz
                <strong> Çözüldü</strong> olur.
              </div>
            </div>

            <label className="space-y-sm block">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Public açıklama</span>
              <textarea
                className="focus-ring min-h-28 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue={statusPage.incident.message}
                name="message"
              />
            </label>

            <div className="grid gap-md md:grid-cols-2">
              {statusPage.components.map((component) => (
                <div key={component.key} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                  <h3 className="font-medium text-text-primary">{component.label}</h3>
                  <label className="mt-md space-y-sm block">
                    <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Sağlık durumu</span>
                    <select
                      className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                      defaultValue={component.status}
                      name={`status_${component.key}`}
                    >
                      <option value="operational">Operasyonel</option>
                      <option value="degraded">Yavaşlama var</option>
                      <option value="partial_outage">Kısmi kesinti</option>
                      <option value="major_outage">Büyük kesinti</option>
                    </select>
                  </label>
                  <label className="mt-md space-y-sm block">
                    <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Bileşen notu</span>
                    <textarea
                      className="focus-ring min-h-24 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                      defaultValue={component.note}
                      name={`note_${component.key}`}
                    />
                  </label>
                </div>
              ))}
            </div>

            <Button type="submit">Durum sayfasını güncelle</Button>
          </form>
        </section>
      </div>
    </PageShell>
  );
}
