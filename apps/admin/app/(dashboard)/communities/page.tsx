import { CommunitiesTable } from "@/components/communities/communities-table";
import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { mockCommunities } from "@/lib/mock-data";

export default function CommunitiesPage() {
  return (
    <PageShell
      eyebrow="Sprint 2 hazirlik"
      title="Topluluklar"
      description="Topluluk listesi ve moderasyon ekraninin temel masaustu tablosu hazir."
    >
      <MockDataBanner label="Communities backend bagimliligi gelene kadar mock akista" />
      <div className="surface-panel p-xl">
        <CommunitiesTable communities={mockCommunities} />
      </div>
    </PageShell>
  );
}
