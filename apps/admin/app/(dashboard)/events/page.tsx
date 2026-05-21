import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { EventsTable } from "@/components/events/events-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminEventsOrMock } from "@/lib/admin-data";
import { mockCommunityEvents } from "@/lib/mock-data";

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: { q?: string; state?: string; risk?: string };
}) {
  const { data: events, usingMockData } = await getAdminEventsOrMock(mockCommunityEvents);
  const query = searchParams?.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const state = searchParams?.state?.trim() ?? "";
  const risk = searchParams?.risk?.trim() ?? "";
  const filteredEvents = events.filter((event) => {
    const matchesQuery =
      !query ||
      [event.title, event.communityName, event.creatorName]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    const matchesState = !state || event.status === state;
    const matchesRisk = !risk || (risk === "flagged" ? event.suspicious : risk === "clean" ? !event.suspicious : true);

    return matchesQuery && matchesState && matchesRisk;
  });

  return (
    <PageShell
      eyebrow="V2.4 community operasyonu"
      title="Etkinlikler"
      description="Yaklaşan community event'leri tek ekranda toplar, yüksek katılım sinyallerini öne çıkarır."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Etkinlik listesi için örnek V2.4 event kuyruğu gösteriliyor."
        liveLabel="Gerçek community event ve RSVP akışı okunuyor."
      />

      <div className="surface-panel p-xl">
        <form className="mb-lg grid gap-md md:grid-cols-2 xl:grid-cols-4" method="get">
          <label className="space-y-sm xl:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
            <Input defaultValue={searchParams?.q ?? ""} name="q" placeholder="Etkinlik, topluluk veya oluşturucu ara" />
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Durum</span>
            <select
              className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
              defaultValue={state}
              name="state"
            >
              <option value="">Tümü</option>
              <option value="scheduled">Planlandı</option>
              <option value="canceled">İptal</option>
              <option value="completed">Tamamlandı</option>
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
              <option value="clean">Normal</option>
            </select>
          </label>
          <div className="flex gap-sm md:col-span-2 xl:col-span-4">
            <Button type="submit">Filtrele</Button>
            <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary" href="/events">
              Temizle
            </a>
          </div>
        </form>

        <EventsTable events={filteredEvents} />
      </div>
    </PageShell>
  );
}
