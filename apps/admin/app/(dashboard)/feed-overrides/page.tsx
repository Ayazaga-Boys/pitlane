import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { TrendingPostsTable } from "@/components/feed/trending-posts-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminFeedOverridesOrMock, getAdminTrendingPostsOrMock } from "@/lib/admin-data";
import { mockFeedOverrides, mockTrendingPosts } from "@/lib/mock-data";

function resultMessage(result: string | undefined) {
  switch (result) {
    case "boosted":
      return "Post feed’de manuel feature olarak işaretlendi.";
    case "shadowbanned":
      return "Post feed’de manuel shadowban aldı.";
    case "cleared":
      return "Feed override temizlendi.";
    case "backend_pending":
      return "Feed override tablosu backend’de henüz hazır değil; UI fallback modunda çalışıyor.";
    case "failed":
      return "Feed override işlemi kaydedilemedi.";
    default:
      return null;
  }
}

export default async function FeedOverridesPage({
  searchParams,
}: {
  searchParams?: { q?: string; state?: string; result?: string };
}) {
  const [{ data: overrides, usingMockData: overridesUsingMockData }, { data: trendingPosts, usingMockData: trendingUsingMockData }] = await Promise.all([
    getAdminFeedOverridesOrMock(mockFeedOverrides),
    getAdminTrendingPostsOrMock(mockTrendingPosts),
  ]);

  const query = searchParams?.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const state = searchParams?.state?.trim() ?? "";
  const result = resultMessage(searchParams?.result);
  const filteredPosts = trendingPosts.filter((post) => {
    const matchesQuery =
      !query ||
      [post.caption, post.authorName, post.authorUsername]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    const matchesState = !state || state === "all" || post.overrideState === state || (state === "none" && post.overrideState === "none");

    return matchesQuery && matchesState;
  });

  return (
    <PageShell
      eyebrow="V2.3 keşfet kontrolü"
      title="Feed Override"
      description="Trend post skorlarını izler ve gerektiğinde algoritmaya manuel feature veya shadowban uygular."
    >
      {result ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          {result}
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={overridesUsingMockData || trendingUsingMockData}
        mockLabel="Trend listesi veya feed override kontratı eksik olduğunda örnek V2.3 keşfet kontrol ekranı gösteriliyor."
        liveLabel="Keşfet trend skorları canlı. Feed override tablosu hazırsa manuel feature/shadowban da aktif."
      />

      <div className="grid gap-lg xl:grid-cols-[0.7fr_0.3fr]">
        <section className="surface-panel p-xl">
          <form className="mb-lg grid gap-md md:grid-cols-2 xl:grid-cols-4" method="get">
            <label className="space-y-sm xl:col-span-3">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
              <Input defaultValue={searchParams?.q ?? ""} name="q" placeholder="Caption veya yazar ara" />
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Override durumu</span>
              <select
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue={state}
                name="state"
              >
                <option value="">Tümü</option>
                <option value="boost">Feature</option>
                <option value="shadowban">Shadowban</option>
                <option value="none">Override yok</option>
              </select>
            </label>
            <div className="flex gap-sm md:col-span-2 xl:col-span-4">
              <Button type="submit">Filtrele</Button>
              <a
                className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary"
                href="/feed-overrides"
              >
                Temizle
              </a>
            </div>
          </form>

          <TrendingPostsTable overridesDisabled={overridesUsingMockData} posts={filteredPosts} />
        </section>

        <section className="space-y-lg">
          <section className="surface-panel p-xl">
            <h3 className="text-lg font-semibold text-text-primary">Aktif manuel kararlar</h3>
            <div className="mt-lg space-y-md">
              {overrides.length > 0 ? (
                overrides.map((override) => (
                  <div key={override.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                    <div className="flex flex-wrap items-center gap-sm">
                      <Badge tone={override.actionType === "boost" ? "success" : "error"}>
                        {override.actionType === "boost" ? "feature" : "shadowban"}
                      </Badge>
                      {override.expiresAt ? <Badge tone="warning">bitiş {override.expiresAt}</Badge> : null}
                    </div>
                    <p className="mt-md font-medium text-text-primary">{override.postCaption}</p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      {override.authorName} · @{override.authorUsername}
                    </p>
                    <p className="mt-md text-sm leading-6 text-text-secondary">{override.reason}</p>
                    <p className="mt-md text-xs text-text-tertiary">Karar zamanı: {override.createdAt}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-surface-3 bg-surface-2 p-lg text-sm text-text-secondary">
                  Aktif manuel override bulunmuyor.
                </div>
              )}
            </div>
          </section>

          <section className="surface-panel p-xl">
            <h3 className="text-lg font-semibold text-text-primary">Operasyon notu</h3>
            <div className="mt-lg space-y-sm text-sm leading-6 text-text-secondary">
              <p>Feature, kaliteli veya kampanya öncelikli gönderileri kısa süreli öne çıkarmak için kullanılmalı.</p>
              <p>Shadowban, spam veya topluluk güvenini zedeleyen ama doğrudan silinmeyen içerikler için ayrılmalı.</p>
              <p>{overridesUsingMockData ? "Override yazma kontratı henüz mock fallback ile izleniyor." : "Override kararları audit log'a config_changed olarak yazılır."}</p>
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
}
