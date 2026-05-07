import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { PinsTable } from "@/components/pins/pins-table";
import { mockPins } from "@/lib/mock-data";
import { getAdminPinsOrMock } from "@/lib/admin-data";

export default async function PinsPage() {
  const { data: pins, usingMockData } = await getAdminPinsOrMock(mockPins);

  return (
    <PageShell
      eyebrow="Sprint 3 hazırlık"
      title="İşletme pinleri"
      description="Pin doğrulama kuyruğu mümkün olduğunda gerçek Supabase verisiyle, aksi durumda mock veriyle çalışır."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek doğrulama kuyruğu için service-role erişimi bekleniyor; şimdilik mock başvurular gösteriliyor."
        liveLabel="Gerçek işletme pin verisi aktif. Doğrulanmamış pinler öncelikli sırada gösteriliyor."
      />
      <div className="surface-panel p-xl">
        <PinsTable pins={pins} />
      </div>
    </PageShell>
  );
}
