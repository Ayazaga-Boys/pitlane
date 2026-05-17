import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminSystemNotificationsOrMock } from "@/lib/admin-data";
import { mockSystemNotifications } from "@/lib/mock-data";
import { sendSystemNotification } from "./actions";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: { result?: string; count?: string };
}) {
  const { data: notifications, usingMockData } = await getAdminSystemNotificationsOrMock(mockSystemNotifications);

  return (
    <PageShell
      eyebrow="Sprint 4 hazırlık"
      title="Bildirimler"
      description="Admin panelden sistem duyurusu gönderip son in-app sistem bildirimlerini izleyebilirsin."
    >
      {searchParams?.result === "sent" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          Sistem bildirimi gönderildi. Hedeflenen kullanıcı sayısı: {searchParams.count ?? "0"}
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek sistem bildirimleri okunamadı; ekran örnek bildirim geçmişi gösteriyor."
        liveLabel="Sistem bildirimi geçmişi gerçek notifications tablosundan okunuyor."
      />

      <div className="grid gap-lg xl:grid-cols-[0.95fr_1.05fr]">
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Sistem bildirimi gönder</h2>
          <p className="mt-sm text-sm leading-6 text-text-secondary">
            Bu form uygulama içi sistem duyurusu üretir. Hedef kitleyi seçip kullanıcılara panel üzerinden bildirim gönderebilirsin.
          </p>

          <form action={sendSystemNotification} className="mt-lg space-y-md">
            <label className="space-y-sm block">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Hedef kitle</span>
              <select
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue="all"
                name="audience"
              >
                <option value="all">Tüm kullanıcılar</option>
                <option value="active_users">Aktif kullanıcılar</option>
                <option value="moderators">Moderatörler</option>
                <option value="admins">Adminler</option>
              </select>
            </label>

            <label className="space-y-sm block">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Başlık</span>
              <input
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary placeholder:text-text-tertiary"
                name="title"
                placeholder="Örn. Hafta sonu bakım penceresi"
                type="text"
              />
            </label>

            <label className="space-y-sm block">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Mesaj gövdesi</span>
              <textarea
                className="focus-ring min-h-36 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary placeholder:text-text-tertiary"
                name="body"
                placeholder="Kullanıcılara görünecek duyuru metnini yaz"
              />
            </label>

            <div className="rounded-md border border-info/25 bg-info/10 p-md text-sm leading-6 text-text-primary">
              Bu akış push değil, uygulama içi sistem bildirimi üretir. Her gönderim audit log’a da yazılır.
            </div>

            <Button type="submit">Sistem bildirimi gönder</Button>
          </form>
        </section>

        <section className="surface-panel p-xl">
          <div className="flex items-center justify-between gap-md">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Son gönderimler</h2>
              <p className="mt-sm text-sm text-text-secondary">En yeni system notification kayıtları burada görünür.</p>
            </div>
            <Badge tone={usingMockData ? "warning" : "success"}>{usingMockData ? "mock" : "live"}</Badge>
          </div>

          <div className="mt-lg space-y-md">
            {notifications.map((notification) => (
              <article key={notification.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <div className="flex flex-wrap items-center justify-between gap-sm">
                  <h3 className="font-medium text-text-primary">{notification.title}</h3>
                  <Badge tone="info">{notification.audience}</Badge>
                </div>
                <p className="mt-sm text-sm leading-6 text-text-secondary">{notification.body}</p>
                <p className="mt-md text-xs uppercase tracking-[0.16em] text-text-tertiary">{notification.createdAt}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
