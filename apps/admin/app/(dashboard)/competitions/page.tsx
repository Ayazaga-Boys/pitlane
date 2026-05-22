import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { CompetitionsTable } from "@/components/competitions/competitions-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminCompetitionsOrMock } from "@/lib/admin-data";
import { mockCompetitions } from "@/lib/mock-data";

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string; risk?: string };
}) {
  const { data: competitions, usingMockData } = await getAdminCompetitionsOrMock(mockCompetitions);
  const query = searchParams?.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const status = searchParams?.status?.trim() ?? "";
  const risk = searchParams?.risk?.trim() ?? "";

  const filteredCompetitions = competitions.filter((competition) => {
    const matchesQuery =
      !query ||
      [competition.title, competition.communityName, competition.filtersSummary]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    const matchesStatus = !status || competition.status === status;
    const matchesRisk = !risk || (risk === "flagged" ? competition.suspicious : risk === "clean" ? !competition.suspicious : true);
    return matchesQuery && matchesStatus && matchesRisk;
  });

  const suspiciousCount = competitions.filter((competition) => competition.suspicious).length;
  const activeVotingCount = competitions.filter((competition) => competition.status === "voting").length;
  const blockedEntriesCount = competitions.reduce((total, competition) => total + competition.blockedEntriesCount, 0);
  const overrideCount = competitions.filter((competition) => competition.adminActionLabel).length;

  return (
    <PageShell
      eyebrow="V2.6 yarışma operasyonu"
      title="Yarışmalar"
      description="Backend yarışma kontratı tamamlanana kadar admin risk görünümü ve operasyon hazırlığını mock data ile sürdürür."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Competitions backend’i beklenirken liste mock veriyle akıyor; admin override kararları audit log üzerinden geri yansıtılıyor."
        liveLabel=""
      />

      <div className="grid gap-lg xl:grid-cols-[0.78fr_0.22fr]">
        <section className="surface-panel p-xl">
          <form className="mb-lg grid gap-md md:grid-cols-2 xl:grid-cols-4" method="get">
            <label className="space-y-sm xl:col-span-2">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
              <Input defaultValue={searchParams?.q ?? ""} name="q" placeholder="Yarışma, topluluk veya filtre ara" />
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Durum</span>
              <select
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue={status}
                name="status"
              >
                <option value="">Tümü</option>
                <option value="draft">Taslak</option>
                <option value="voting">Oylama</option>
                <option value="completed">Tamamlandı</option>
                <option value="canceled">İptal</option>
              </select>
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Risk</span>
              <select
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue={risk}
                name="risk"
              >
                <option value="">Tümü</option>
                <option value="flagged">Şüpheli</option>
                <option value="clean">Temiz</option>
              </select>
            </label>
            <div className="flex gap-sm md:col-span-2 xl:col-span-4">
              <Button type="submit">Filtrele</Button>
              <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary" href="/competitions">
                Temizle
              </a>
            </div>
          </form>

          <CompetitionsTable competitions={filteredCompetitions} />
        </section>

        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Hazırlık özeti</h2>
          <div className="mt-lg space-y-md">
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Aktif oylama</p>
              <p className="mt-xs text-3xl font-semibold text-text-primary">{activeVotingCount}</p>
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Şüpheli yarışma</p>
              <p className="mt-xs text-3xl font-semibold text-text-primary">{suspiciousCount}</p>
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Bloklu entry</p>
              <p className="mt-xs text-3xl font-semibold text-text-primary">{blockedEntriesCount}</p>
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Admin override</p>
              <p className="mt-xs text-3xl font-semibold text-text-primary">{overrideCount}</p>
            </div>
            <div className="rounded-md border border-warning/25 bg-warning/10 p-lg text-sm leading-6 text-text-primary">
              Backend açıkları:
              `competitions`, `competition_entries` ve vote akışı henüz tamamlanmadı. O zamana kadar admin aksiyonları audit tabanlı override olarak tutuluyor.
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg text-sm leading-6 text-text-secondary">
              Hazır kontratlar: yarışma liste görünümü, risk sıralaması, audit override.
              Bekleyen kontratlar: gerçek entry listesi, vote breakdown, topluluk bazlı yarışma endpoint'leri.
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Admin kullanım notu</p>
              <p className="mt-sm text-sm leading-6 text-text-primary">
                Bu ekran şu an operasyon kararını kaybetmemek için override-first çalışır. Backend sync geldiğinde aynı sayfa gerçek yarışma
                kayıtlarını okuyacak; mevcut audit izleri ise korunmaya devam edecek.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
