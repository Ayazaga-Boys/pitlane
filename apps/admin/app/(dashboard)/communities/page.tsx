import { CommunitiesTable } from "@/components/communities/communities-table";
import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { mockCommunities } from "@/lib/mock-data";

export default function CommunitiesPage() {
  return (
    <PageShell
      eyebrow="Sprint 2 hazırlık"
      title="Topluluklar"
      description="Topluluk listesi ve moderasyon ekranının temel masaüstü tablosu hazır."
    >
      <MockDataBanner label="Topluluk backend bağımlılığı gelene kadar mock akışta" />
      <div className="surface-panel p-xl">
        <CommunitiesTable communities={mockCommunities} />
      </div>
    </PageShell>
  );
}
