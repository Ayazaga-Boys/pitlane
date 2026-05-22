import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { CommunityNeedsTable } from "@/components/community-needs/community-needs-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminCommunityNeedsOrMock } from "@/lib/admin-data";
import { mockCommunityNeeds } from "@/lib/mock-data";

export default async function CommunityNeedsPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string; urgency?: string; flagged?: string; result?: string };
}) {
  const { data: needs, usingMockData } = await getAdminCommunityNeedsOrMock(mockCommunityNeeds);
  const query = searchParams?.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const status = searchParams?.status?.trim() ?? "";
  const urgency = searchParams?.urgency?.trim() ?? "";
  const flagged = searchParams?.flagged?.trim() ?? "";

  const filteredNeeds = needs.filter((need) => {
    const matchesQuery =
      !query ||
      [need.body, need.communityName, need.creatorName, need.creatorUsername]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    const matchesStatus = !status || need.status === status;
    const matchesUrgency = !urgency || need.urgencyColor === urgency;
    const matchesFlagged = !flagged || (flagged === "yes" ? need.flaggedAsSpam : flagged === "no" ? !need.flaggedAsSpam : true);
    return matchesQuery && matchesStatus && matchesUrgency && matchesFlagged;
  });

  const flaggedCount = needs.filter((need) => need.flaggedAsSpam).length;

  return (
    <PageShell
      eyebrow="V2.6 community operations"
      title="Community Needs"
      description="Yedek parça, yakıt ve yardım ilanlarını izler; backend flagged akışı ve spam sinyallerini operasyona taşır."
    >
      {searchParams?.result === "suspended" ? (
        <div className="rounded-md border border-warning/30 bg-warning/10 p-md text-sm leading-6 text-text-primary">
          Spam sinyali üreten kullanıcı 7 gün askıya alındı ve user detail akışına yansıtıldı.
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Community needs kontratı için örnek spam izleme ekranı gösteriliyor."
        liveLabel="Gerçek community need verisi okunuyor; backend flagged, spam score ve spam reason alanları öncelikleniyor."
      />

      <div className="grid gap-lg xl:grid-cols-[0.8fr_0.2fr]">
        <section className="surface-panel p-xl">
          <form className="mb-lg grid gap-md md:grid-cols-2 xl:grid-cols-4" method="get">
            <label className="space-y-sm xl:col-span-2">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
              <Input defaultValue={searchParams?.q ?? ""} name="q" placeholder="İlan, topluluk veya kullanıcı ara" />
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Durum</span>
              <select className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary" defaultValue={status} name="status">
                <option value="">Tümü</option>
                <option value="open">Açık</option>
                <option value="flagged">Flagli</option>
                <option value="resolved">Çözüldü</option>
                <option value="closed">Kapalı</option>
              </select>
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Aciliyet</span>
              <select className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary" defaultValue={urgency} name="urgency">
                <option value="">Tümü</option>
                <option value="red">Kırmızı</option>
                <option value="yellow">Sarı</option>
              </select>
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Spam flag</span>
              <select className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary" defaultValue={flagged} name="flagged">
                <option value="">Tümü</option>
                <option value="yes">Flagli</option>
                <option value="no">Temiz</option>
              </select>
            </label>
            <div className="flex gap-sm md:col-span-2 xl:col-span-4">
              <Button type="submit">Filtrele</Button>
              <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary" href="/community-needs">
                Temizle
              </a>
            </div>
          </form>

          <CommunityNeedsTable needs={filteredNeeds} usingMockData={usingMockData} />
        </section>

        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Spam özeti</h2>
          <div className="mt-lg space-y-md">
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Toplam açık ilan</p>
              <p className="mt-xs text-3xl font-semibold text-text-primary">{needs.filter((need) => need.status === "open").length}</p>
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Flagli kullanıcı</p>
              <p className="mt-xs text-3xl font-semibold text-text-primary">{flaggedCount}</p>
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Auto action eşiği</p>
              <p className="mt-xs text-3xl font-semibold text-text-primary">5+</p>
            </div>
            <p className="text-sm leading-6 text-text-secondary">
              Aynı kullanıcı 24 saat içinde 5+ ilan ürettiğinde backend yeni kaydı otomatik `flagged` işaretleyebilir. Varsa spam score ve reason tabloya düşer; operatör bu ekrandan 7 günlük suspend uygulayabilir.
            </p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
