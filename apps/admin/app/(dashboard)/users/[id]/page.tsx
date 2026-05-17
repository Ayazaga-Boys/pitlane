import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { UserDetailGrid } from "@/components/users/user-detail-grid";
import { UserSummaryCard } from "@/components/users/user-summary-card";
import { getAdminUserByIdOrMock } from "@/lib/admin-data";
import { mockUsers } from "@/lib/mock-data";
import { liftUserBan, permanentlyBanUser, saveSupportNote, suspendUserForSevenDays } from "./actions";

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { result?: string };
}) {
  const { data: detail, usingMockData } = await getAdminUserByIdOrMock(params.id, mockUsers);

  if (!detail) {
    notFound();
  }

  const user = detail.user;
  const suspendAction = suspendUserForSevenDays.bind(null, params.id);
  const banAction = permanentlyBanUser.bind(null, params.id);
  const unbanAction = liftUserBan.bind(null, params.id);
  const noteAction = saveSupportNote.bind(null, params.id);

  return (
    <PageShell
      eyebrow="Sprint 2 hazırlık"
      title="Kullanıcı detayı"
      description="Kullanıcı detayı gerçek `profiles`, `vehicles` ve moderasyon kayıtları okunabildiğinde canlı veriyi gösterir."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href="/users"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Kullanıcı listesine dön
      </Link>

      {searchParams?.result === "suspended" ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-md text-sm leading-6 text-text-primary">
          Kullanıcı 7 günlüğüne askıya alındı.
        </div>
      ) : null}
      {searchParams?.result === "banned" ? (
        <div className="rounded-md border border-error/30 bg-error/10 p-md text-sm leading-6 text-text-primary">
          Kullanıcı kalıcı olarak banlandı, push cihaz kayıtları temizlendi.
        </div>
      ) : null}
      {searchParams?.result === "unbanned" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          Kullanıcının banı kaldırıldı ve önceki rolü geri yüklendi.
        </div>
      ) : null}
      {searchParams?.result === "note_saved" ? (
        <div className="rounded-md border border-info/30 bg-info/10 p-md text-sm leading-6 text-text-primary">
          Destek notu kaydedildi ve audit log’a yazıldı.
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Detay ekranı için gerçek kullanıcı verisi bulunamadı; örnek kayıt gösteriliyor."
        liveLabel="Kullanıcı profili, araçlar ve ilişkili topluluk kayıtları gerçek veriden geliyor."
      />
      <UserSummaryCard user={user} />
      <div className="grid gap-lg xl:grid-cols-[1fr_0.9fr]">
        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Moderasyon aksiyonları</h3>
          <p className="mt-md text-sm leading-6 text-text-secondary">
            Bu aksiyonlar service-role ile çalışır ve audit log üzerinde kayıt bırakır. Askıya alma geçici, ban ise kalıcıdır.
          </p>

          <div className="mt-lg grid gap-md md:grid-cols-3">
            <form action={suspendAction}>
              <Button className="w-full" disabled={usingMockData || user.status === "suspended"} type="submit" variant="secondary">
                7 gün askıya al
              </Button>
            </form>
            <form action={banAction}>
              <Button className="w-full" disabled={usingMockData || user.status === "suspended"} type="submit" variant="destructive">
                Kalıcı ban
              </Button>
            </form>
            <form action={unbanAction}>
              <Button className="w-full" disabled={usingMockData || user.status === "active"} type="submit">
                Banı kaldır
              </Button>
            </form>
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Destek notu ekle</h3>
          <form action={noteAction} className="mt-lg space-y-md">
            <textarea
              className="focus-ring min-h-32 w-full rounded-sm border border-surface-3 bg-surface-2 px-md py-md text-sm text-text-primary placeholder:text-text-tertiary"
              defaultValue=""
              name="supportNote"
              placeholder="CM ekibi için kullanıcı hakkında kısa operasyon notu yaz"
            />
            <Button disabled={usingMockData} type="submit">
              Notu kaydet
            </Button>
          </form>

          <div className="mt-lg space-y-md">
            {detail.supportNotes.length > 0 ? (
              detail.supportNotes.map((note) => (
                <div key={note.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                  <p className="text-sm leading-6 text-text-primary">{note.note}</p>
                  <p className="mt-sm text-xs text-text-tertiary">{note.createdAt}</p>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg text-sm text-text-secondary">
                Kayıtlı destek notu bulunmuyor.
              </div>
            )}
          </div>
        </section>
      </div>
      <UserDetailGrid user={user} />
    </PageShell>
  );
}
