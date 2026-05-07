import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardStats } from "@/lib/dashboard";

export default async function DashboardPage() {
  const { stats, usingMockData } = await getDashboardStats();

  return (
    <PageShell
      eyebrow="Canli genel bakis"
      title="Dashboard"
      description="Sprint 1 icin admin panelin temel operasyon kartlari burada. Profiles tablosu henuz hazir degilse sayaçlar mock veri ile dolarak iskeleti calisir durumda tutar."
    >
      {usingMockData ? (
        <MockDataBanner label="Gercek sayaclar icin `profiles`, `help_requests`, `business_pins` ve `flares` migrationlari bekleniyor" />
      ) : null}

      <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>

      <div className="grid gap-lg xl:grid-cols-[1.4fr_0.6fr]">
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Sprint 1 kapsam durumu</h2>
          <div className="mt-lg grid gap-md md:grid-cols-2">
            {[
              "Next.js 14 App Router iskeleti",
              "Supabase browser ve server client ayrimi",
              "Middleware auth ve admin role kontrolu",
              "Sidebar, header ve temel route seti",
            ].map((item) => (
              <div key={item} className="rounded-md border border-surface-3 bg-surface-2 p-lg text-sm text-text-secondary">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Sonraki bagimliliklar</h2>
          <ul className="mt-lg space-y-md text-sm leading-6 text-text-secondary">
            <li>`profiles` migration tamamlaninca role fallback ihtiyaci kalkacak.</li>
            <li>`business_pins` dogrulama sayfalari Sprint 3 detaylariyla genisleyecek.</li>
            <li>Analitik grafikler gercek aggregate sorgularla dolacak.</li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
