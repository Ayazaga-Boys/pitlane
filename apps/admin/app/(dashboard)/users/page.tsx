import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { UsersTable } from "@/components/users/users-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockUsers } from "@/lib/mock-data";

export default function UsersPage() {
  return (
    <PageShell
      eyebrow="Sprint 2 hazırlık"
      title="Kullanıcılar"
      description="Gerçek `profiles` migrationı gelene kadar bu ekran admin akışlarını mock veriyle prova eder."
    >
      <MockDataBanner label="Profiles bağımlılığı bekleniyor" />
      <div className="surface-panel p-xl">
        <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-md md:flex-row">
            <Input placeholder="Username veya display name ara" />
            <Input placeholder="Rol filtresi: kullanıcı, moderatör, admin" />
          </div>
          <Button variant="secondary">Dışa aktar</Button>
        </div>
        <div className="mt-lg">
          <UsersTable users={mockUsers} />
        </div>
      </div>
    </PageShell>
  );
}
