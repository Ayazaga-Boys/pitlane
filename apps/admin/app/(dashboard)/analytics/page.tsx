import { MiniBarChart } from "@/components/analytics/mini-bar-chart";
import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { mockAnalytics } from "@/lib/mock-data";

export default function AnalyticsPage() {
  return (
    <PageShell
      eyebrow="Sprint 4 hazirlik"
      title="Analitik"
      description="Recharts baglantisi gelmeden once metrik kartlari ve grafik yerlesimi mock veriyle kuruluyor."
    >
      <MockDataBanner label="Gercek aggregate sorgular yerine ornek trend verisi kullaniliyor" />
      <div className="grid gap-lg xl:grid-cols-2">
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Aylik aktif kullanici trendi</h2>
          <p className="mt-sm text-sm text-text-secondary">MAU paneli yerlesimi ve olcek testi.</p>
          <div className="mt-xl">
            <MiniBarChart data={mockAnalytics.mau} />
          </div>
        </section>
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Haftalik flare olusumu</h2>
          <p className="mt-sm text-sm text-text-secondary">Gunluk aktivite bolumu icin gorsel iskelet.</p>
          <div className="mt-xl">
            <MiniBarChart data={mockAnalytics.flares} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
