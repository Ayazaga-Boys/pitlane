import { Badge } from "@/components/ui/badge";
import type { MockCommunity } from "@/lib/mock-data";

function mapMemberRole(role: MockCommunity["memberList"][number]["role"]) {
  if (role === "captain") return { label: "kaptan", tone: "error" as const };
  if (role === "moderator") return { label: "moderatör", tone: "info" as const };
  return { label: "üye", tone: "default" as const };
}

function mapFlareStatus(status: MockCommunity["activeFlares"][number]["status"]) {
  if (status === "active") return { label: "aktif", tone: "success" as const };
  if (status === "draft") return { label: "taslak", tone: "warning" as const };
  return { label: "iptal", tone: "error" as const };
}

export function CommunityDetailGrid({ community }: { community: MockCommunity }) {
  return (
    <div className="grid gap-lg xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-lg">
        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Üyeler</h3>
          <div className="mt-lg space-y-md">
            {community.memberList.map((member) => {
              const badge = mapMemberRole(member.role);
              return (
                <div key={member.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                  <div className="flex flex-wrap items-center justify-between gap-md">
                    <p className="font-medium text-text-primary">{member.name}</p>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Aktif flare akışı</h3>
          <div className="mt-lg space-y-md">
            {community.activeFlares.map((flare) => {
              const badge = mapFlareStatus(flare.status);
              return (
                <div key={flare.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                  <div className="flex flex-wrap items-start justify-between gap-md">
                    <div>
                      <p className="font-medium text-text-primary">{flare.title}</p>
                      <p className="mt-sm text-xs text-text-tertiary">{flare.startsAt}</p>
                    </div>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </div>
                  <p className="mt-md text-sm text-text-secondary">{flare.rsvpCount} RSVP kaydı bulunuyor.</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="space-y-lg">
        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Moderasyon notu</h3>
          <p className="mt-lg text-sm leading-6 text-text-secondary">{community.moderationNote}</p>
        </section>

        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Operasyon özeti</h3>
          <div className="mt-lg grid gap-md sm:grid-cols-2">
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Topluluk tipi</p>
              <p className="mt-sm text-sm text-text-primary">
                {community.type === "public" ? "Açık katılım" : community.type === "private" ? "Onaylı üyelik" : "Gizli erişim"}
              </p>
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Araç kapsamı</p>
              <p className="mt-sm text-sm text-text-primary">
                {community.vehicleType === "car"
                  ? "Otomobil odaklı"
                  : community.vehicleType === "motorcycle"
                    ? "Motosiklet odaklı"
                    : "Karma araç grubu"}
              </p>
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Bugünkü karar</p>
              <p className="mt-sm text-sm leading-6 text-text-secondary">
                Bu görünüm, topluluğun üye yapısını ve flare yoğunluğunu tek ekranda toplayarak moderasyon kararını daha hızlı vermeyi
                hedefler.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
