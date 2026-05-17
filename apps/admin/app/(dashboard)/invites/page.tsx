import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { InviteCodesTable } from "@/components/invites/invite-codes-table";
import { getAdminInviteCodesOrMock } from "@/lib/admin-data";
import { mockInviteCodes } from "@/lib/mock-data";
import { createInviteBatch } from "./actions";

export default async function InvitesPage({
  searchParams,
}: {
  searchParams?: { result?: string; count?: string };
}) {
  const { data: inviteCodes, usingMockData } = await getAdminInviteCodesOrMock(mockInviteCodes);

  const totalCodes = inviteCodes.length;
  const totalUses = inviteCodes.reduce((sum, entry) => sum + entry.usesCount, 0);
  const remainingCapacity = inviteCodes.reduce((sum, entry) => sum + Math.max(entry.maxUses - entry.usesCount, 0), 0);

  return (
    <PageShell
      eyebrow="Sprint 5 hazırlık"
      title="Davet kodları"
      description="Toplu davet kodu oluşturup kullanım kapasitesini ve kalan hakkı buradan takip edebilirsin."
    >
      {searchParams?.result === "created" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.count ?? "0"} adet yeni davet kodu oluşturuldu.
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek davet kodu kayıtları okunamadı; ekran örnek kodlarla test modunda."
        liveLabel="Davet kodları gerçek Supabase verisinden okunuyor."
      />

      <div className="grid gap-lg xl:grid-cols-[0.9fr_1.1fr]">
        <section className="surface-panel p-xl">
          <div className="grid gap-md md:grid-cols-3">
            <article className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Toplam kod</p>
              <p className="mt-sm text-4xl font-semibold text-text-primary">{totalCodes}</p>
            </article>
            <article className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Toplam kullanım</p>
              <p className="mt-sm text-4xl font-semibold text-text-primary">{totalUses}</p>
            </article>
            <article className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Kalan kapasite</p>
              <p className="mt-sm text-4xl font-semibold text-text-primary">{remainingCapacity}</p>
            </article>
          </div>

          <form action={createInviteBatch} className="mt-lg space-y-md">
            <div className="grid gap-md md:grid-cols-2">
              <label className="space-y-sm block">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Kod prefix</span>
                <input
                  className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  defaultValue="ROLLPIT"
                  name="prefix"
                  type="text"
                />
              </label>

              <label className="space-y-sm block">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Kod adedi</span>
                <input
                  className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  defaultValue="5"
                  max={50}
                  min={1}
                  name="count"
                  type="number"
                />
              </label>
            </div>

            <div className="grid gap-md md:grid-cols-2">
              <label className="space-y-sm block">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Maksimum kullanım</span>
                <input
                  className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  defaultValue="5"
                  max={20}
                  min={1}
                  name="maxUses"
                  type="number"
                />
              </label>

              <label className="space-y-sm block">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Bitiş tarihi</span>
                <input
                  className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  name="expiresAt"
                  type="datetime-local"
                />
              </label>
            </div>

            <div className="rounded-md border border-info/25 bg-info/10 p-md text-sm leading-6 text-text-primary">
              Her kod varsayılan olarak bir admin havuzuna değil, işlemi yapan admin kullanıcısına bağlanır.
            </div>

            <Button disabled={usingMockData} type="submit">
              Toplu davet kodu oluştur
            </Button>
          </form>
        </section>

        <section className="surface-panel p-xl">
          <div className="flex items-center justify-between gap-md">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Aktif kodlar</h2>
              <p className="mt-sm text-sm text-text-secondary">Kullanım, bitiş ve oluşturulma bilgileri burada görünür.</p>
            </div>
            <Badge tone={usingMockData ? "warning" : "success"}>{usingMockData ? "mock" : "live"}</Badge>
          </div>

          <div className="mt-lg">
            <InviteCodesTable codes={inviteCodes} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
