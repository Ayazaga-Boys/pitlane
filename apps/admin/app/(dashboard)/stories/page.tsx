import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoriesGrid } from "@/components/stories/stories-grid";
import { getAdminStoriesOrMock } from "@/lib/admin-data";
import { mockModerationStories } from "@/lib/mock-data";

export default async function StoriesPage({
  searchParams,
}: {
  searchParams?: { q?: string; audience?: string; state?: string };
}) {
  const { data: stories, usingMockData } = await getAdminStoriesOrMock(mockModerationStories);
  const query = searchParams?.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const audience = searchParams?.audience?.trim() ?? "";
  const state = searchParams?.state?.trim() ?? "";

  const filteredStories = stories.filter((story) => {
    const matchesQuery =
      !query ||
      [story.authorName, story.authorUsername, story.mediaKind]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    const matchesAudience = !audience || story.audience === audience;
    const matchesState =
      !state ||
      (state === "urgent"
        ? story.isExpiringSoon && !story.deletedAt
        : state === "deleted"
          ? Boolean(story.deletedAt)
          : state === "active"
            ? !story.deletedAt
            : true);

    return matchesQuery && matchesAudience && matchesState;
  });

  return (
    <PageShell
      eyebrow="V2.3 moderasyon"
      title="Story Moderasyonu"
      description="Aktif story kuyruğu, acil sona erecek içerikleri öne çıkarır ve hızlı müdahale akışı sunar."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Story moderasyonunda örnek kuyruk aktif."
        liveLabel="Gerçek stories ve story_views verileriyle moderasyon kuyruğu aktif."
      />
      <div className="surface-panel p-xl">
        <form className="mb-lg grid gap-md md:grid-cols-2 xl:grid-cols-4" method="get">
          <label className="space-y-sm xl:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
            <Input defaultValue={searchParams?.q ?? ""} name="q" placeholder="Yazar veya medya tipi ara" />
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Audience</span>
            <select
              className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
              defaultValue={audience}
              name="audience"
            >
              <option value="">Tümü</option>
              <option value="public">Public</option>
              <option value="followers">Followers</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Durum</span>
            <select
              className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
              defaultValue={state}
              name="state"
            >
              <option value="">Tümü</option>
              <option value="active">Aktif</option>
              <option value="urgent">Acil</option>
              <option value="deleted">Kaldırılmış</option>
            </select>
          </label>
          <div className="flex gap-sm md:col-span-2 xl:col-span-4">
            <Button type="submit">Filtrele</Button>
            <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary" href="/stories">
              Temizle
            </a>
          </div>
        </form>
        <StoriesGrid stories={filteredStories} />
      </div>
    </PageShell>
  );
}
