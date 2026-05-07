import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { ReportsTable } from "@/components/reports/reports-table";
import { mockReports } from "@/lib/mock-data";

export default function ReportsPage() {
  return (
    <PageShell
      eyebrow="Sprint 3 hazirlik"
      title="Sikayetler"
      description="Moderasyon kuyrugunun oncelik mantigi ve liste duzeni mock raporlarla calisiyor."
    >
      <MockDataBanner label="Reports tablosu hazir olana kadar sahte moderasyon kuyrugu aktif" />
      <div className="surface-panel p-xl">
        <ReportsTable reports={mockReports} />
      </div>
    </PageShell>
  );
}
