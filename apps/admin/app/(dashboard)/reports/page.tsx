import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { ReportsTable } from "@/components/reports/reports-table";
import { mockReports } from "@/lib/mock-data";

export default function ReportsPage() {
  return (
    <PageShell
      eyebrow="Sprint 3 hazırlık"
      title="Şikayetler"
      description="Moderasyon kuyruğunun öncelik mantığı ve liste düzeni mock raporlarla çalışıyor."
    >
      <MockDataBanner label="Reports tablosu hazır olana kadar sahte moderasyon kuyruğu aktif" />
      <div className="surface-panel p-xl">
        <ReportsTable reports={mockReports} />
      </div>
    </PageShell>
  );
}
