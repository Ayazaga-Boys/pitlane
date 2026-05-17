import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { ReportsTable } from "@/components/reports/reports-table";
import { mockReports } from "@/lib/mock-data";
import { getAdminReportsOrMock } from "@/lib/admin-data";

export default async function ReportsPage() {
  const { data: reports, usingMockData } = await getAdminReportsOrMock(mockReports);

  return (
    <PageShell
      eyebrow="Sprint 3 hazırlık"
      title="Şikayetler"
      description="Moderasyon kuyruğu service-role erişimi varsa gerçek rapor verisini, yoksa mock listeyi gösterir."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek rapor listesi için service-role erişimi bekleniyor; şimdilik mock moderasyon kuyruğu aktif."
        liveLabel="Gerçek rapor verisi aktif. Şikayet kuyruğu Supabase üzerinden okunuyor."
      />
      <div className="surface-panel p-xl">
        <ReportsTable reports={reports} />
      </div>
    </PageShell>
  );
}
