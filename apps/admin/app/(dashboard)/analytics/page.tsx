import { MiniBarChart } from "@/components/analytics/mini-bar-chart";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { getAdminAnalyticsOrMock } from "@/lib/admin-data";
import { mockAnalytics } from "@/lib/mock-data";

export default async function AnalyticsPage() {
  const { data: analytics, usingMockData } = await getAdminAnalyticsOrMock(mockAnalytics);

  return (
    <PageShell
      eyebrow="Sprint 4 hazırlık"
      title="Analitik"
      description="Kullanıcı, flare, yardım ve topluluk akışının aggregate görünümü mümkün olduğunda gerçek Supabase verisinden beslenir."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek aggregate sorgular okunamadı; analitik ekranı geçici olarak örnek trend verisi gösteriyor."
        liveLabel="Aggregate metrikler gerçek Supabase tablolarından okunuyor."
      />

      <div className="grid gap-md md:grid-cols-2 xl:grid-cols-4">
        <section className="surface-panel p-xl">
          <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Toplam profil</p>
          <p className="mt-md text-3xl font-semibold text-text-primary">{analytics.summary.totalProfiles}</p>
          <p className="mt-sm text-sm text-text-secondary">Panelde görünen kullanıcı profilleri</p>
        </section>
        <section className="surface-panel p-xl">
          <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Toplam flare</p>
          <p className="mt-md text-3xl font-semibold text-text-primary">{analytics.summary.totalFlares}</p>
          <p className="mt-sm text-sm text-text-secondary">Şimdiye kadar oluşturulan flare kaydı</p>
        </section>
        <section className="surface-panel p-xl">
          <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Açık yardım</p>
          <p className="mt-md text-3xl font-semibold text-text-primary">{analytics.summary.openHelpRequests}</p>
          <p className="mt-sm text-sm text-text-secondary">Şu anda çözülmemiş yardım talepleri</p>
        </section>
        <section className="surface-panel p-xl">
          <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Bekleyen rapor</p>
          <p className="mt-md text-3xl font-semibold text-text-primary">{analytics.summary.pendingReports}</p>
          <p className="mt-sm text-sm text-text-secondary">İnceleme kuyruğunda bekleyen şikayetler</p>
        </section>
      </div>

      <div className="grid gap-lg xl:grid-cols-2">
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Aylık aktif kullanıcı trendi</h2>
          <p className="mt-sm text-sm text-text-secondary">Son 5 ayda kullanıcı hareketliliğinin aylık yoğunluğu.</p>
          <div className="mt-xl">
            <MiniBarChart data={analytics.monthlyActiveUsers} />
          </div>
        </section>
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Haftalık flare oluşumu</h2>
          <p className="mt-sm text-sm text-text-secondary">Son 7 günde oluşturulan flare kayıtlarının gün bazlı dağılımı.</p>
          <div className="mt-xl">
            <MiniBarChart data={analytics.weeklyFlares} />
          </div>
        </section>
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Açık yardım talebi dağılımı</h2>
          <p className="mt-sm text-sm text-text-secondary">Çözülmemiş yardım çağrılarının issue type kırılımı.</p>
          <div className="mt-xl">
            <MiniBarChart data={analytics.helpByIssue} />
          </div>
        </section>
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Topluluk büyüme trendi</h2>
          <p className="mt-sm text-sm text-text-secondary">Son 5 ayda açılan toplulukların aylık dağılımı.</p>
          <div className="mt-xl">
            <MiniBarChart data={analytics.communityGrowth} />
          </div>
        </section>
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Yardım talebi yanıt süresi</h2>
          <p className="mt-sm text-sm text-text-secondary">Çözülen yardım taleplerinde aylık ortalama yanıt süresi (saat).</p>
          <div className="mt-xl">
            <MiniBarChart data={analytics.helpResponseTimes} />
          </div>
        </section>
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Bekleme listesi büyümesi</h2>
          <p className="mt-sm text-sm text-text-secondary">Son 5 ayda bekleme listesine eklenen yeni aday sayısı.</p>
          <div className="mt-xl">
            <MiniBarChart data={analytics.waitingListGrowth} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
