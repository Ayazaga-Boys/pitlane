import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { WaitingListTable } from "@/components/waiting-list/waiting-list-table";
import { getAdminWaitingListOrMock } from "@/lib/admin-data";
import { mockWaitingList } from "@/lib/mock-data";
import { sendWaveInvites } from "./actions";

export default async function WaitingListPage({
  searchParams,
}: {
  searchParams?: { result?: string; count?: string };
}) {
  const { data: entries, usingMockData } = await getAdminWaitingListOrMock(mockWaitingList);

  const pendingCount = entries.filter((entry) => !entry.invitedAt).length;
  const invitedCount = entries.filter((entry) => entry.invitedAt).length;

  return (
    <PageShell
      eyebrow="Sprint 5 hazırlık"
      title="Bekleme listesi"
      description="Wave invite akışını burada yönetebilir, henüz davet edilmemiş adayları kapasiteye göre içeri alabilirsin."
    >
      {searchParams?.result === "sent" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.count ?? "0"} aday için wave invite işaretlendi.
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek bekleme listesi kayıtları okunamadı; ekran örnek aday kuyruğuyla test modunda."
        liveLabel="Bekleme listesi gerçek Supabase verisinden okunuyor."
      />

      <div className="grid gap-lg xl:grid-cols-[0.9fr_1.1fr]">
        <section className="surface-panel p-xl">
          <div className="grid gap-md md:grid-cols-2">
            <article className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Bekleyen aday</p>
              <p className="mt-sm text-4xl font-semibold text-text-primary">{pendingCount}</p>
            </article>
            <article className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Davet işaretli</p>
              <p className="mt-sm text-4xl font-semibold text-text-primary">{invitedCount}</p>
            </article>
          </div>

          <form action={sendWaveInvites} className="mt-lg space-y-md">
            <label className="space-y-sm block">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Wave invite adedi</span>
              <input
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue="100"
                max={500}
                min={1}
                name="count"
                type="number"
              />
            </label>

            <div className="rounded-md border border-info/25 bg-info/10 p-md text-sm leading-6 text-text-primary">
              Bu aksiyon bekleme listesindeki en eski, henüz davet edilmemiş adayları seçer ve onları davet gönderildi
              olarak işaretler.
            </div>

            <Button disabled={usingMockData} type="submit">
              Wave invite başlat
            </Button>
          </form>
        </section>

        <section className="surface-panel p-xl">
          <div className="flex items-center justify-between gap-md">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Aday kuyruğu</h2>
              <p className="mt-sm text-sm text-text-secondary">Listeye giriş tarihi ve davet durumu buradan izlenir.</p>
            </div>
            <Badge tone={usingMockData ? "warning" : "success"}>{usingMockData ? "mock" : "live"}</Badge>
          </div>

          <div className="mt-lg">
            <WaitingListTable entries={entries} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
