import { Badge } from "@/components/ui/badge";
import type { MockUser } from "@/lib/mock-data";

function mapVehicleType(type: MockUser["vehicles"][number]["type"]) {
  if (type === "car") return "otomobil";
  if (type === "motorcycle") return "motosiklet";
  return "diğer";
}

function mapCommunityRole(role: MockUser["communities"][number]["role"]) {
  if (role === "captain") return "kaptan";
  if (role === "moderator") return "moderatör";
  return "üye";
}

function mapReportStatus(status: MockUser["reportHistory"][number]["status"]) {
  if (status === "resolved") return { label: "çözüldü", tone: "success" as const };
  if (status === "reviewing") return { label: "inceleniyor", tone: "info" as const };
  return { label: "bekliyor", tone: "warning" as const };
}

function getInitials(entry: MockUser["followers"][number]) {
  return entry.displayName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function FollowRelationList({
  entries,
  emptyLabel,
  title,
}: {
  entries: MockUser["followers"];
  emptyLabel: string;
  title: string;
}) {
  return (
    <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
      <div className="flex items-center justify-between gap-md">
        <h4 className="font-medium text-text-primary">{title}</h4>
        <Badge tone="default">{entries.length}</Badge>
      </div>
      <div className="mt-md space-y-md">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div key={`${title}-${entry.id}-${entry.followedAt}`} className="flex items-center gap-md rounded-md border border-surface-3/80 bg-surface-1 p-md">
              {entry.avatarUrl ? (
                <img
                  alt={`${entry.displayName} avatar`}
                  className="size-10 rounded-full border border-surface-3 object-cover"
                  height={40}
                  src={entry.avatarUrl}
                  width={40}
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full border border-surface-3 bg-surface-2 text-xs font-semibold text-text-secondary">
                  {getInitials(entry)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">{entry.displayName}</p>
                <p className="mt-1 text-xs text-text-tertiary">@{entry.username}</p>
              </div>
              <div className="text-right">
                <Badge tone={entry.isPrivate ? "warning" : "success"}>{entry.isPrivate ? "private" : "public"}</Badge>
                <p className="mt-2 text-xs text-text-tertiary">{entry.followedAt}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-surface-3/80 bg-surface-1 p-md text-sm text-text-secondary">{emptyLabel}</div>
        )}
      </div>
    </div>
  );
}

export function UserDetailGrid({ user }: { user: MockUser }) {
  return (
    <div className="grid gap-lg xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-lg">
        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Araçlar</h3>
          <div className="mt-lg space-y-md">
            {user.vehicles.map((vehicle) => (
              <div key={vehicle.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <div className="flex flex-wrap items-center gap-sm">
                  <p className="font-medium text-text-primary">
                    {vehicle.make} {vehicle.model}
                  </p>
                  {vehicle.isPrimary ? <Badge tone="success">birincil</Badge> : null}
                  <Badge tone="default">{mapVehicleType(vehicle.type)}</Badge>
                </div>
                <p className="mt-sm text-sm text-text-secondary">{vehicle.year}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Topluluklar</h3>
          <div className="mt-lg space-y-md">
            {user.communities.map((community) => (
              <div key={community.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <div className="flex items-center justify-between gap-md">
                  <p className="font-medium text-text-primary">{community.name}</p>
                  <Badge tone={community.role === "moderator" ? "info" : community.role === "captain" ? "error" : "default"}>
                    {mapCommunityRole(community.role)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Follow ilişkileri</h3>
          <p className="mt-sm text-sm leading-6 text-text-secondary">
            Support override için son 25 takipçi ve takip edilen kullanıcı burada görünür.
          </p>
          <div className="mt-lg grid gap-md xl:grid-cols-2">
            <FollowRelationList entries={user.followers} emptyLabel="Kayıtlı takipçi bulunmuyor." title="Takipçiler" />
            <FollowRelationList entries={user.following} emptyLabel="Takip edilen kullanıcı bulunmuyor." title="Takip edilenler" />
          </div>
        </section>
      </div>

      <div className="space-y-lg">
        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Destek notu</h3>
          <p className="mt-lg text-sm leading-6 text-text-secondary">{user.supportNote}</p>
        </section>

        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Şikayet geçmişi</h3>
          <div className="mt-lg space-y-md">
            {user.reportHistory.length > 0 ? (
              user.reportHistory.map((report) => {
                const badge = mapReportStatus(report.status);
                return (
                  <div key={report.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                    <div className="flex items-start justify-between gap-md">
                      <div>
                        <p className="font-medium text-text-primary">{report.reason}</p>
                        <p className="mt-sm text-xs text-text-tertiary">{report.createdAt}</p>
                      </div>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg text-sm text-text-secondary">
                Kayıtlı şikayet geçmişi bulunmuyor.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
