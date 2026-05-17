import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { UsersTable } from "@/components/users/users-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminUsersOrMock } from "@/lib/admin-data";
import { mockUsers } from "@/lib/mock-data";

function normalizeValue(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function toComparableDate(value: string) {
  const [day, month, year] = value.split(".");
  if (!day || !month || !year) {
    return Number.NaN;
  }

  return new Date(`${year}-${month}-${day}T00:00:00`).getTime();
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: { q?: string; role?: string; status?: string; from?: string };
}) {
  const { data: users, usingMockData } = await getAdminUsersOrMock(mockUsers);
  const query = searchParams?.q?.trim() ?? "";
  const role = searchParams?.role?.trim() ?? "";
  const status = searchParams?.status?.trim() ?? "";
  const from = searchParams?.from?.trim() ?? "";

  const filteredUsers = users.filter((user) => {
    const matchesQuery =
      !query ||
      normalizeValue([user.username, user.displayName, user.city].join(" ")).includes(normalizeValue(query));
    const matchesRole = !role || user.role === role;
    const matchesStatus = !status || user.status === status;
    const matchesFrom = !from || toComparableDate(user.createdAt) >= new Date(`${from}T00:00:00`).getTime();

    return matchesQuery && matchesRole && matchesStatus && matchesFrom;
  });

  return (
    <PageShell
      eyebrow="Sprint 2 hazırlık"
      title="Kullanıcılar"
      description="Kullanıcı listesi mümkün olduğunda gerçek `profiles` verisinden, aksi durumda mock kayıtlarla çalışır."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek profiles verisi okunamadı; şimdilik mock kullanıcı listesi gösteriliyor."
        liveLabel="Gerçek profiles, vehicles ve topluluk üyelikleri listede aktif."
      />
      <div className="surface-panel p-xl">
        <form className="flex flex-col gap-md xl:flex-row xl:items-end xl:justify-between" method="get">
          <div className="grid flex-1 gap-md md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
              <Input defaultValue={query} name="q" placeholder="Username veya display name ara" />
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Rol</span>
              <select
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue={role}
                name="role"
              >
                <option value="">Tüm roller</option>
                <option value="user">Kullanıcı</option>
                <option value="moderator">Moderatör</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Durum</span>
              <select
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue={status}
                name="status"
              >
                <option value="">Tüm durumlar</option>
                <option value="active">Aktif</option>
                <option value="suspended">Askıda</option>
              </select>
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Kayıt tarihi</span>
              <Input defaultValue={from} name="from" type="date" />
            </label>
          </div>

          <div className="flex gap-sm">
            <Button type="submit">Filtrele</Button>
            <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary" href="/users">
              Temizle
            </a>
            <Button variant="secondary">Dışa aktar</Button>
          </div>
        </form>
        <div className="mt-lg">
          <UsersTable users={filteredUsers} />
        </div>
      </div>
    </PageShell>
  );
}
