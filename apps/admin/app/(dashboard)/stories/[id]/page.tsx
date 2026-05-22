import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminStoryByIdOrMock } from "@/lib/admin-data";
import { getAdminIdentity } from "@/lib/auth";
import { mockModerationStories } from "@/lib/mock-data";
import { banStoryAuthor, deleteStoryContent, restoreStoryContent, suspendStoryAuthor, warnStoryAuthor } from "./actions";

function mapAudienceLabel(audience: "public" | "followers" | "private") {
  if (audience === "followers") return "takipçiler";
  if (audience === "private") return "private";
  return "public";
}

export default async function StoryDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { result?: string };
}) {
  const identity = await getAdminIdentity();
  const { data: detail, usingMockData } = await getAdminStoryByIdOrMock(params.id, mockModerationStories);
  if (!detail) notFound();

  const isModerator = identity.role === "moderator";
  const deleteAction = deleteStoryContent.bind(null, params.id);
  const restoreAction = restoreStoryContent.bind(null, params.id);
  const warnAction = warnStoryAuthor.bind(null, params.id);
  const suspendAction = suspendStoryAuthor.bind(null, params.id);
  const banAction = banStoryAuthor.bind(null, params.id);

  return (
    <PageShell
      eyebrow="V2.3 moderasyon"
      title="Story detayı"
      description="Story preview, izleyici listesi ve hızlı moderasyon aksiyonlarını tek ekranda toplar."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href="/stories"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Story kuyruğuna dön
      </Link>

      {searchParams?.result ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.result === "content_deleted"
            ? "Story kaldırıldı."
            : searchParams.result === "content_restored"
              ? "Story geri yüklendi."
              : searchParams.result === "warned"
                ? "Story sahibine uyarı gönderildi."
                : searchParams.result === "suspended"
                  ? "Story sahibi 7 gün askıya alındı."
                  : "Story sahibi kalıcı olarak banlandı."}
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Story detayında örnek moderasyon akışı gösteriliyor."
        liveLabel="Gerçek story ve viewer verileriyle detay ekranı aktif."
      />

      <div className="grid gap-lg xl:grid-cols-[0.7fr_0.3fr]">
        <section className="surface-panel overflow-hidden p-xl">
          <div className="mb-lg flex flex-wrap items-center gap-sm">
            <Badge tone={detail.story.deletedAt ? "error" : detail.story.isExpiringSoon ? "warning" : "success"}>
              {detail.story.deletedAt ? "kaldırıldı" : detail.story.isExpiringSoon ? "acil" : "aktif"}
            </Badge>
            <Badge tone="default">{mapAudienceLabel(detail.story.audience)}</Badge>
            <Badge tone="info">{detail.story.viewsCount} görüntüleme</Badge>
          </div>
          <div className="overflow-hidden rounded-md border border-surface-3 bg-surface-2">
            {detail.story.mediaPreviewUrl ? (
              <img alt={`${detail.story.authorName} story preview`} className="aspect-[9/16] w-full object-cover" src={detail.story.mediaPreviewUrl} />
            ) : (
              <div className="flex aspect-[9/16] items-center justify-center p-xl text-sm text-text-secondary">Preview hazır değil</div>
            )}
          </div>
        </section>

        <section className="space-y-lg">
          <section className="surface-panel p-xl">
            <h3 className="text-lg font-semibold text-text-primary">{detail.story.authorName}</h3>
            <p className="mt-1 text-sm text-text-secondary">@{detail.story.authorUsername}</p>
            <div className="mt-lg grid gap-sm text-sm text-text-secondary">
              <p>Oluşturulma: {detail.story.createdAt}</p>
              <p>Bitiş: {detail.story.expiresAt}</p>
              <p>Yazar durumu: {detail.story.authorStatus === "active" ? "aktif" : "askıda"}</p>
            </div>
          </section>

          <section className="surface-panel p-xl">
            <h3 className="text-lg font-semibold text-text-primary">Moderasyon aksiyonları</h3>
            <div className="mt-lg grid gap-md">
              <form action={deleteAction}>
                <Button className="w-full" disabled={usingMockData || Boolean(detail.story.deletedAt)} type="submit" variant="secondary">
                  İçeriği kaldır
                </Button>
              </form>
              <form action={restoreAction}>
                <Button className="w-full" disabled={usingMockData || !detail.story.deletedAt} type="submit" variant="ghost">
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
            <h3 className="text-lg font-semibold text-text-primary">İzleyiciler</h3>
            <div className="mt-lg space-y-md">
              {detail.viewers.length > 0 ? (
                detail.viewers.map((viewer) => (
                  <div key={`${viewer.id}-${viewer.viewedAt}`} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                    <p className="font-medium text-text-primary">{viewer.displayName}</p>
                    <p className="mt-1 text-xs text-text-tertiary">@{viewer.username}</p>
                    <p className="mt-2 text-xs text-text-tertiary">{viewer.viewedAt}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-surface-3 bg-surface-2 p-lg text-sm text-text-secondary">
                  İzleyici kaydı bulunmuyor.
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
}
