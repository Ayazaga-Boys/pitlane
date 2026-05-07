import { Badge } from "@/components/ui/badge";
import type { MockUser } from "@/lib/mock-data";

export function UserSummaryCard({ user }: { user: MockUser }) {
  return (
    <section className="surface-panel p-xl">
      <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">
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
            <Badge tone="default">{user.city}</Badge>
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
        </div>
      </div>
    </section>
  );
}
