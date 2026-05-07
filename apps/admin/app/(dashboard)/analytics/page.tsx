import { MiniBarChart } from "@/components/analytics/mini-bar-chart";
import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { mockAnalytics } from "@/lib/mock-data";

export default function AnalyticsPage() {
  return (
    <PageShell
      eyebrow="Sprint 4 hazırlık"
      title="Analitik"
      description="Grafik bağlantısı gelmeden önce metrik kartları ve yerleşim mock veriyle kuruluyor."
    >
      <MockDataBanner label="Gerçek toplu sorgular yerine örnek trend verisi kullanılıyor" />
      <div className="grid gap-lg xl:grid-cols-2">
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Aylık aktif kullanıcı trendi</h2>
          <p className="mt-sm text-sm text-text-secondary">MAU paneli yerleşimi ve ölçek testi.</p>
          <div className="mt-xl">
            <MiniBarChart data={mockAnalytics.mau} />
          </div>
        </section>
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Haftalık flare oluşumu</h2>
          <p className="mt-sm text-sm text-text-secondary">Günlük aktivite bölümü için görsel iskelet.</p>
          <div className="mt-xl">
            <MiniBarChart data={mockAnalytics.flares} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
