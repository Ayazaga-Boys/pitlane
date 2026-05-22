import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommunityInvitesTable } from "@/components/invites/community-invites-table";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { InviteCodesTable } from "@/components/invites/invite-codes-table";
import { getAdminCommunityInvitesOrMock, getAdminInviteCodesOrMock } from "@/lib/admin-data";
import { mockCommunityInvites, mockInviteCodes } from "@/lib/mock-data";
import { createInviteBatch } from "./actions";

export default async function InvitesPage({
  searchParams,
}: {
  searchParams?: { result?: string; count?: string; q?: string; mode?: string; state?: string; risk?: string };
}) {
  const [{ data: inviteCodes, usingMockData }, { data: communityInvites, usingMockData: communityInvitesUsingMockData }] = await Promise.all([
    getAdminInviteCodesOrMock(mockInviteCodes),
    getAdminCommunityInvitesOrMock(mockCommunityInvites),
  ]);

  const totalCodes = inviteCodes.length;
  const totalUses = inviteCodes.reduce((sum, entry) => sum + entry.usesCount, 0);
  const remainingCapacity = inviteCodes.reduce((sum, entry) => sum + Math.max(entry.maxUses - entry.usesCount, 0), 0);
  const query = searchParams?.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const mode = searchParams?.mode?.trim() ?? "";
  const state = searchParams?.state?.trim() ?? "";
  const risk = searchParams?.risk?.trim() ?? "";
  const filteredCommunityInvites = communityInvites.filter((invite) => {
    const matchesQuery =
      !query ||
      [invite.communityName, invite.creatorName, invite.token]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    const matchesMode = !mode || invite.mode === mode;
    const matchesState = !state || invite.status === state;
    const matchesRisk = !risk || (risk === "flagged" ? invite.suspicious : risk === "clean" ? !invite.suspicious : true);

    return matchesQuery && matchesMode && matchesState && matchesRisk;
  });
  const suspiciousCount = communityInvites.filter((invite) => invite.suspicious).length;
  const activeCommunityInvites = communityInvites.filter((invite) => invite.status === "active").length;

  return (
    <PageShell
      eyebrow="V2.4 davet yönetimi"
      title="Davet kodları"
      description="Admin batch kodlarıyla birlikte community invite linklerini izler, şüpheli olanları buradan revoke edebilirsin."
    >
      {searchParams?.result === "created" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.count ?? "0"} adet yeni davet kodu oluşturuldu.
        </div>
      ) : searchParams?.result === "community_invite_revoked" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          Community invite revoke edildi ve audit log kaydı oluşturuldu.
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

      <section className="surface-panel p-xl">
        <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Community invite yönetimi</h2>
            <p className="mt-sm text-sm text-text-secondary">
              Link ve kod bazlı topluluk davetlerini izler; yüksek kullanım veya beklenmeyen request yoğunluğunda revoke akışı açar.
            </p>
          </div>
          <div className="grid gap-md sm:grid-cols-2">
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Aktif invite</p>
              <p className="mt-xs text-2xl font-semibold text-text-primary">{activeCommunityInvites}</p>
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Şüpheli invite</p>
              <p className="mt-xs text-2xl font-semibold text-text-primary">{suspiciousCount}</p>
            </div>
          </div>
        </div>

        <DataStateBanner
          usingMockData={communityInvitesUsingMockData}
          mockLabel="Community invite kontratı okunamadığında örnek revoke kuyruğu gösteriliyor."
          liveLabel="Community invite ve join request sinyalleri gerçek kayıtlardan okunuyor."
        />

        <form className="mt-lg grid gap-md md:grid-cols-2 xl:grid-cols-5" method="get">
          <label className="space-y-sm xl:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
            <Input defaultValue={searchParams?.q ?? ""} name="q" placeholder="Topluluk, creator veya token ara" />
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Mod</span>
            <select
              className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
              defaultValue={mode}
              name="mode"
            >
              <option value="">Tümü</option>
              <option value="instant">Instant</option>
              <option value="request">Request</option>
            </select>
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Durum</span>
            <select
              className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
              defaultValue={state}
              name="state"
            >
              <option value="">Tümü</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
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
          <div className="flex gap-sm md:col-span-2 xl:col-span-5">
            <Button type="submit">Filtrele</Button>
            <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary" href="/invites">
              Temizle
            </a>
          </div>
        </form>

        <div className="mt-lg">
          <CommunityInvitesTable actionsDisabled={communityInvitesUsingMockData} invites={filteredCommunityInvites} />
        </div>
      </section>
    </PageShell>
  );
}
