import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostsTable } from "@/components/posts/posts-table";
import { getAdminPostsOrMock } from "@/lib/admin-data";
import { mockModerationPosts } from "@/lib/mock-data";

export default async function PostsPage({
  searchParams,
}: {
  searchParams?: { q?: string; visibility?: string; state?: string; reports?: string };
}) {
  const { data: posts, usingMockData } = await getAdminPostsOrMock(mockModerationPosts);
  const query = searchParams?.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const visibility = searchParams?.visibility?.trim() ?? "";
  const state = searchParams?.state?.trim() ?? "";
  const reports = searchParams?.reports?.trim() ?? "";
  const filteredPosts = posts.filter((post) => {
    const matchesQuery =
      !query ||
      [post.caption, post.authorName, post.authorUsername, post.latestReportReason ?? ""]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    const matchesVisibility = !visibility || post.visibility === visibility;
    const matchesState = !state || (state === "deleted" ? Boolean(post.deletedAt) : state === "active" ? !post.deletedAt : true);
    const matchesReports =
      !reports || (reports === "reported" ? post.reportsCount > 0 : reports === "clean" ? post.reportsCount === 0 : true);

    return matchesQuery && matchesVisibility && matchesState && matchesReports;
  });

  return (
    <PageShell
      eyebrow="V2.2 moderasyon"
      title="Post Moderasyonu"
      description="Raporlanan gönderileri öne alır; içerik kaldırma ve kullanıcı moderasyonu için detay ekranına yönlendirir."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Post rapor kontratı backend’de tamamlanana kadar örnek moderasyon kuyruğu gösteriliyor."
        liveLabel="Gerçek post kuyruğu aktif. Gönderiler posts/comments/reports verilerinden okunuyor."
      />
      <div className="surface-panel p-xl">
        <form className="mb-lg grid gap-md md:grid-cols-2 xl:grid-cols-4" method="get">
          <label className="space-y-sm xl:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
            <Input defaultValue={searchParams?.q ?? ""} name="q" placeholder="Caption, yazar veya rapor nedeni ara" />
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Görünürlük</span>
            <select
              className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
              defaultValue={visibility}
              name="visibility"
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
              <option value="deleted">Kaldırılmış</option>
            </select>
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Rapor</span>
            <select
              className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
              defaultValue={reports}
              name="reports"
            >
              <option value="">Tümü</option>
              <option value="reported">Raporlu</option>
              <option value="clean">Temiz</option>
            </select>
          </label>
          <div className="flex gap-sm md:col-span-2 xl:col-span-4">
            <Button type="submit">Filtrele</Button>
            <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary" href="/posts">
              Temizle
            </a>
          </div>
        </form>
        <PostsTable posts={filteredPosts} />
      </div>
    </PageShell>
  );
}
