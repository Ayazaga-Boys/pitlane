import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { UsersTable } from "@/components/users/users-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminUsersOrMock } from "@/lib/admin-data";
import { mockUsers } from "@/lib/mock-data";

export default async function UsersPage() {
  const { data: users, usingMockData } = await getAdminUsersOrMock(mockUsers);

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
        <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-md md:flex-row">
            <Input placeholder="Username veya display name ara" />
            <Input placeholder="Rol filtresi: kullanıcı, moderatör, admin" />
          </div>
          <Button variant="secondary">Dışa aktar</Button>
        </div>
        <div className="mt-lg">
          <UsersTable users={users} />
        </div>
      </div>
    </PageShell>
  );
}
