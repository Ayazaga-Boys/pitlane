import { Badge } from "@/components/ui/badge";
import type { MockUser } from "@/lib/mock-data";

function getInitials(user: MockUser) {
  return user.displayName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapLocationShareMode(mode: MockUser["locationShareMode"]) {
  if (mode === "followers") return "takipçilerle";
  if (mode === "none") return "kapalı";
  return "herkese açık";
}

export function UserSummaryCard({ user }: { user: MockUser }) {
  return (
    <section className="surface-panel p-xl">
      <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-start">
          {user.avatarUrl ? (
            <img
              alt={`${user.displayName} profil fotoğrafı`}
              className="size-24 rounded-full border border-surface-3 object-cover"
              height={96}
              src={user.avatarUrl}
              width={96}
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-full border border-surface-3 bg-surface-2 text-2xl font-semibold text-text-secondary">
              {getInitials(user)}
            </div>
          )}

          <div className="space-y-md">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-pit-red-soft">@{user.username}</p>
              <h2 className="mt-xs text-2xl font-semibold text-text-primary">{user.displayName}</h2>
              <p className="mt-sm max-w-2xl text-sm leading-6 text-text-secondary">{user.bio}</p>
            </div>

            <div className="flex flex-wrap gap-sm">
              <Badge tone={user.role === "admin" ? "error" : user.role === "moderator" ? "info" : "default"}>
                {user.role === "admin" ? "admin" : user.role === "moderator" ? "moderatör" : "kullanıcı"}
              </Badge>
              <Badge tone={user.status === "active" ? "success" : "warning"}>
                {user.status === "active" ? "aktif" : "askıda"}
              </Badge>
              <Badge tone={user.isPrivate ? "warning" : "success"}>{user.isPrivate ? "private profil" : "public profil"}</Badge>
              <Badge tone="default">{user.city}</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-md rounded-md border border-surface-3 bg-surface-2 p-lg sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Telefon</p>
            <p className="mt-xs text-sm text-text-primary">{user.phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Son görüldü</p>
            <p className="mt-xs text-sm text-text-primary">{user.lastSeenAt}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Kayıt tarihi</p>
            <p className="mt-xs text-sm text-text-primary">{user.createdAt}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Toplam şikayet</p>
            <p className="mt-xs text-sm text-text-primary">{user.reports}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Takipçi / takip</p>
            <p className="mt-xs text-sm text-text-primary">
              {user.followersCount} / {user.followingCount}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Konum paylaşımı</p>
            <p className="mt-xs text-sm text-text-primary">{mapLocationShareMode(user.locationShareMode)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
