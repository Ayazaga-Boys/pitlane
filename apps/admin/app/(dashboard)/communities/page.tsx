import { CommunitiesTable } from "@/components/communities/communities-table";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { getAdminCommunitiesOrMock } from "@/lib/admin-data";
import { mockCommunities } from "@/lib/mock-data";

export default async function CommunitiesPage() {
  const { data: communities, usingMockData } = await getAdminCommunitiesOrMock(mockCommunities);

  return (
    <PageShell
      eyebrow="Sprint 2 hazırlık"
      title="Topluluklar"
      description="Topluluk listesi gerçek `communities` verisi varsa canlı, aksi durumda mock akışla çalışır."
    >
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
