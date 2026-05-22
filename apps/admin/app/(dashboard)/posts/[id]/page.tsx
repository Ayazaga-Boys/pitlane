import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminPostByIdOrMock } from "@/lib/admin-data";
import { getAdminIdentity } from "@/lib/auth";
import { mockModerationComments, mockModerationPosts } from "@/lib/mock-data";
import { banPostAuthor, deletePostContent, restorePostContent, suspendPostAuthor, warnPostAuthor } from "./actions";

function mapVisibilityLabel(visibility: "public" | "followers" | "private") {
  if (visibility === "followers") return "takipçiler";
  if (visibility === "private") return "private";
  return "public";
}

function formatModerationScore(score: number | null | undefined) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return "Yok";
  }

  return `${Math.round(score * 100)} / 100`;
}

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { result?: string };
}) {
  const identity = await getAdminIdentity();
  const { data: detail, usingMockData } = await getAdminPostByIdOrMock(params.id, mockModerationPosts, mockModerationComments);

  if (!detail) {
    notFound();
  }

  const deleteAction = deletePostContent.bind(null, params.id);
  const restoreAction = restorePostContent.bind(null, params.id);
  const warnAction = warnPostAuthor.bind(null, params.id);
  const suspendAction = suspendPostAuthor.bind(null, params.id);
  const banAction = banPostAuthor.bind(null, params.id);
  const isModerator = identity.role === "moderator";

  return (
    <PageShell
      eyebrow="V2.2 moderasyon"
      title="Post detayı"
      description="Caption, medya alanı, yorum yoğunluğu ve rapor geçmişini tek ekranda görüp aksiyon al."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href="/posts"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Post kuyruğuna dön
      </Link>

      {searchParams?.result ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.result === "content_deleted"
            ? "Gönderi moderasyon akışıyla kaldırıldı."
            : searchParams.result === "content_restored"
              ? "Gönderi tekrar görünür hale getirildi."
            : searchParams.result === "warned"
              ? "Gönderi sahibine uyarı gönderildi."
              : searchParams.result === "suspended"
                ? "Gönderi sahibi 7 gün askıya alındı."
                : "Gönderi sahibi kalıcı olarak banlandı."}
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Post detayında şu an örnek moderasyon akışı gösteriliyor."
        liveLabel="Gerçek gönderi verisi açık. Aşağıdaki aksiyonlar doğrudan panel yetkileriyle çalışır."
      />

      <section className="surface-panel p-xl">
        <div className="flex flex-col gap-lg xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-md">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-pit-red-soft">@{detail.post.authorUsername}</p>
              <h2 className="mt-xs text-2xl font-semibold text-text-primary">{detail.post.authorName}</h2>
              <p className="mt-sm max-w-3xl text-sm leading-7 text-text-secondary">{detail.post.caption}</p>
            </div>

            <div className="flex flex-wrap gap-sm">
              <Badge tone={detail.post.deletedAt ? "error" : detail.post.mediaModeration?.status === "blocked" ? "error" : detail.post.mediaModeration?.status === "review" || detail.post.reportsCount > 0 ? "warning" : "success"}>
                {detail.post.deletedAt
                  ? "kaldırıldı"
                  : detail.post.mediaModeration?.status === "blocked"
                    ? "oto engel"
                    : detail.post.mediaModeration?.status === "review" || detail.post.reportsCount > 0
                      ? "incelemede"
                      : "temiz"}
              </Badge>
              <Badge tone="default">{mapVisibilityLabel(detail.post.visibility)}</Badge>
              <Badge tone="info">{detail.post.reportsCount} rapor</Badge>
              <Badge tone="default">{detail.post.commentsCount} yorum</Badge>
              {detail.post.mediaModeration ? (
                <Badge tone={detail.post.mediaModeration.status === "blocked" ? "error" : detail.post.mediaModeration.status === "review" ? "warning" : "success"}>
                  CF {detail.post.mediaModeration.status === "blocked" ? "engel" : detail.post.mediaModeration.status === "review" ? "incele" : "temiz"}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="grid gap-md rounded-md border border-surface-3 bg-surface-2 p-lg sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Oluşturulma</p>
              <p className="mt-xs text-sm text-text-primary">{detail.post.createdAt}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Yazar durumu</p>
              <p className="mt-xs text-sm text-text-primary">{detail.post.authorStatus === "active" ? "aktif" : "askıda"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Son rapor</p>
              <p className="mt-xs text-sm text-text-primary">{detail.post.latestReportAt ?? "Yok"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Kaldırılma</p>
              <p className="mt-xs text-sm text-text-primary">{detail.post.deletedAt ?? "Aktif"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">CF skor</p>
              <p className="mt-xs text-sm text-text-primary">{formatModerationScore(detail.post.mediaModeration?.score)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">CF etiket</p>
              <p className="mt-xs text-sm text-text-primary">
                {detail.post.mediaModeration?.labels.length ? detail.post.mediaModeration.labels.join(", ") : "Yok"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-lg xl:grid-cols-[1fr_0.92fr]">
        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Medya önizleme</h3>
          <div className="mt-lg overflow-hidden rounded-md border border-surface-3 bg-surface-2">
            {detail.post.mediaPreviewUrl ? (
              <img
                alt={`${detail.post.authorName} gönderi medyası`}
                className="h-[320px] w-full object-cover"
                src={detail.post.mediaPreviewUrl}
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center p-xl text-sm text-text-secondary">
                Canlı medya URL’si hazır değil. Medya kaydı panelde bağlı görünüyor olsa da önizleme üretilemedi.
              </div>
            )}
          </div>

          <div className="mt-lg rounded-md border border-surface-3 bg-surface-2 p-lg">
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Cloudflare Images moderasyon sinyali</p>
            <div className="mt-md rounded-md border border-surface-3/80 bg-surface-1 p-md text-sm leading-6 text-text-secondary">
              {detail.post.mediaModeration ? (
                <>
                  <p className="font-medium text-text-primary">
                    {detail.post.mediaModeration.status === "blocked"
                      ? "Medya otomatik olarak yüksek risk sinyali verdi."
                      : detail.post.mediaModeration.status === "review"
                        ? "Medya manuel inceleme eşiğine düştü."
                        : "Medya temiz görünüyor."}
                  </p>
                  <p className="mt-2">
                    Sağlayıcı: {detail.post.mediaModeration.provider} · Skor: {formatModerationScore(detail.post.mediaModeration.score)}
                  </p>
                  {detail.post.mediaModeration.reason ? <p className="mt-2">Neden: {detail.post.mediaModeration.reason}</p> : null}
                  {detail.post.mediaModeration.flaggedAt ? <p className="mt-2">İşaretlenme: {detail.post.mediaModeration.flaggedAt}</p> : null}
                </>
              ) : (
                "Media asset üzerinde moderasyon alanı görünmüyor. Backend sinyali düştüğünde bu kart otomatik dolacak."
              )}
            </div>
          </div>

          <div className="mt-lg rounded-md border border-surface-3 bg-surface-2 p-lg">
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">İlgili raporlar</p>
            <div className="mt-md space-y-md">
              {detail.relatedReports.length > 0 ? (
                detail.relatedReports.map((report) => (
                  <div key={report.id} className="rounded-md border border-surface-3/80 bg-surface-1 p-md">
                    <div className="flex items-start justify-between gap-md">
                      <div>
                        <p className="font-medium text-text-primary">{report.reason}</p>
                        <p className="mt-1 text-xs text-text-tertiary">{report.reporterLabel} · {report.createdAt}</p>
                      </div>
                      <Badge tone={report.status === "pending" ? "warning" : report.status === "dismissed" ? "default" : "success"}>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-surface-3/80 bg-surface-1 p-md text-sm text-text-secondary">
                  Bu gönderi için henüz rapor kaydı görünmüyor.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-lg">
          <section className="surface-panel p-xl">
            <h3 className="text-lg font-semibold text-text-primary">Moderasyon aksiyonları</h3>
            <div className="mt-lg grid gap-md">
              <form action={deleteAction}>
                <Button className="w-full" disabled={usingMockData || Boolean(detail.post.deletedAt)} type="submit" variant="secondary">
                  İçeriği kaldır
                </Button>
              </form>
              <form action={restoreAction}>
                <Button className="w-full" disabled={usingMockData || !detail.post.deletedAt} type="submit" variant="ghost">
                  İçeriği geri yükle
                </Button>
              </form>
              <form action={warnAction}>
                <Button className="w-full" disabled={usingMockData} type="submit">
                  Yazarı uyar
                </Button>
              </form>
              <form action={suspendAction}>
                <Button className="w-full" disabled={usingMockData || isModerator} type="submit" variant="secondary">
                  7 gün suspend
                </Button>
              </form>
              <form action={banAction}>
                <Button className="w-full" disabled={usingMockData || isModerator} type="submit" variant="destructive">
                  Kalıcı ban
                </Button>
              </form>
            </div>
          </section>

          <section className="surface-panel p-xl">
            <h3 className="text-lg font-semibold text-text-primary">Son yorumlar</h3>
            <div className="mt-lg space-y-md">
              {detail.recentComments.length > 0 ? (
                detail.recentComments.map((comment) => (
                  <div key={comment.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                    <div className="flex items-start justify-between gap-md">
                      <div>
                        <p className="font-medium text-text-primary">{comment.authorName}</p>
                        <p className="mt-1 text-sm leading-6 text-text-secondary">{comment.body}</p>
                        <p className="mt-2 text-xs text-text-tertiary">{comment.createdAt}</p>
                      </div>
                      <Badge tone={comment.reportsCount > 0 ? "warning" : "default"}>{comment.reportsCount} rapor</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-surface-3 bg-surface-2 p-lg text-sm text-text-secondary">
                  Bu gönderi için yakın yorum kaydı yok.
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
}
