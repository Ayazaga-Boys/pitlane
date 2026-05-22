import { CommunitiesTable } from "@/components/communities/communities-table";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { getAdminCommunitiesOrMock } from "@/lib/admin-data";
import { mockCommunities } from "@/lib/mock-data";

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams?: { result?: string };
}) {
  const { data: communities, usingMockData } = await getAdminCommunitiesOrMock(mockCommunities);

  return (
    <PageShell
      eyebrow="Sprint 2 hazırlık"
      title="Topluluklar"
      description="Topluluk listesi gerçek `communities` verisi varsa canlı, aksi durumda mock akışla çalışır."
    >
      {searchParams?.result === "deleted" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          Topluluk silindi ve liste yeniden yüklendi.
        </div>
      ) : null}
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek communities verisi okunamadı; şimdilik örnek topluluk listesi aktif."
        liveLabel="Topluluk listesi, üye sayıları ve aktif flare bağlantıları gerçek veriden geliyor."
      />
      <div className="surface-panel p-xl">
        <CommunitiesTable communities={communities} />
      </div>
    </PageShell>
  );
}
