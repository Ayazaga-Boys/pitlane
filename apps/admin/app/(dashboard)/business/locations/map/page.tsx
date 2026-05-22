import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { BusinessLocationsTable } from "@/components/business/business-locations-table";
import { Badge } from "@/components/ui/badge";
import { getAdminBusinessLocationsOrMock } from "@/lib/admin-data";
import { mockBusinessLocations } from "@/lib/mock-data";

export default async function BusinessLocationsMapPage() {
  const { data: locations, usingMockData } = await getAdminBusinessLocationsOrMock(mockBusinessLocations);

  return (
    <PageShell
      eyebrow="V2.5 business map"
      title="İşletme Lokasyon Haritası"
      description="Onaylı işletmelerin koordinat, featured sırası ve kapsama görünümünü tek ekranda toplar."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Harita entegrasyonu gelene kadar örnek business location koordinat panosu gösteriliyor."
        liveLabel="Gerçek business location kayıtları aktif."
      />

      <div className="grid gap-lg xl:grid-cols-[0.62fr_0.38fr]">
        <section className="surface-panel p-xl">
          <div className="mb-lg flex items-center justify-between gap-md">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Koordinat panosu</h2>
              <p className="mt-sm text-sm text-text-secondary">Bu sürümde harita embed yerine koordinat ve featured yoğunluğu öne çıkarılıyor.</p>
            </div>
            <Badge tone={usingMockData ? "warning" : "success"}>{usingMockData ? "mock" : "live"}</Badge>
          </div>

          <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
            {locations.map((location) => (
              <article key={location.id} className="overflow-hidden rounded-md border border-surface-3 bg-surface-2">
                <div className="h-28 w-full bg-surface-1">
                  {location.photoUrl ? (
                    <img alt={`${location.businessName} preview`} className="h-full w-full object-cover" src={location.photoUrl} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-text-tertiary">foto yok</div>
                  )}
                </div>
                <div className="space-y-sm p-lg">
                  <div className="flex items-center justify-between gap-sm">
                    <p className="font-medium text-text-primary">{location.businessName}</p>
                    <Badge tone={location.featuredRank <= 3 ? "success" : "default"}>#{location.featuredRank}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary">{location.address}</p>
                  <p className="font-mono text-xs text-text-tertiary">
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Operasyon tablosu</h2>
          <div className="mt-lg">
            <BusinessLocationsTable locations={locations} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
