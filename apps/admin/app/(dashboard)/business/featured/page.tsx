import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { FeaturedBusinessesTable } from "@/components/business/featured-businesses-table";
import { Badge } from "@/components/ui/badge";
import { getAdminBusinessLocationsOrMock } from "@/lib/admin-data";
import { mockBusinessLocations } from "@/lib/mock-data";

export default async function FeaturedBusinessesPage({
  searchParams,
}: {
  searchParams?: { result?: string };
}) {
  const { data: locations, usingMockData } = await getAdminBusinessLocationsOrMock(mockBusinessLocations);

  return (
    <PageShell
      eyebrow="V2.5 featured management"
      title="Featured İşletmeler"
      description="Homepage ve harita öne çıkarma sırasını `featured_rank` üzerinden server-side yönetir."
    >
      {searchParams?.result === "rank_updated" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          Featured sırası güncellendi ve audit log kaydı yazıldı.
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Featured sıralama kontratı için örnek business location kuyruğu gösteriliyor."
        liveLabel="Gerçek business location sıralaması `featured_rank` üzerinden okunuyor."
      />

      <section className="surface-panel p-xl">
        <div className="mb-lg flex items-center justify-between gap-md">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Server-side sıra yönetimi</h2>
            <p className="mt-sm text-sm text-text-secondary">Düşük rank daha görünür olur. 0-3 arası vitrinde, 10+ normal akışta kalacak şekilde düşünülmeli.</p>
          </div>
          <Badge tone={usingMockData ? "warning" : "success"}>{usingMockData ? "mock" : "live"}</Badge>
        </div>
        <FeaturedBusinessesTable actionsDisabled={usingMockData} locations={locations} />
      </section>
    </PageShell>
  );
}
