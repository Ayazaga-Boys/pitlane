import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { BusinessApplicationsTable } from "@/components/business/business-applications-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminBusinessApplicationsOrMock } from "@/lib/admin-data";
import { mockBusinessApplications } from "@/lib/mock-data";

export default async function BusinessApplicationsPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string; category?: string };
}) {
  const { data: applications, usingMockData } = await getAdminBusinessApplicationsOrMock(mockBusinessApplications);
  const query = searchParams?.q?.trim().toLocaleLowerCase("tr-TR") ?? "";
  const status = searchParams?.status?.trim() ?? "";
  const category = searchParams?.category?.trim() ?? "";
  const filteredApplications = applications.filter((application) => {
    const matchesQuery =
      !query ||
      [application.businessName, application.applicantName, application.applicantUsername, application.address]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query);
    const matchesStatus = !status || application.status === status;
    const matchesCategory = !category || application.category === category;

    return matchesQuery && matchesStatus && matchesCategory;
  });

  return (
    <PageShell
      eyebrow="V2.5 business onboarding"
      title="İşletme Başvuruları"
      description="Tamirci, galeri, satıcı ve benzeri işletme onboarding başvurularını inceler; onay ve red akışına yönlendirir."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Business onboarding kontratı için örnek başvuru kuyruğu gösteriliyor."
        liveLabel="Gerçek business application ve belge kayıtları okunuyor."
      />

      <div className="surface-panel p-xl">
        <form className="mb-lg grid gap-md md:grid-cols-2 xl:grid-cols-4" method="get">
          <label className="space-y-sm xl:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
            <Input defaultValue={searchParams?.q ?? ""} name="q" placeholder="İşletme, başvuran veya adres ara" />
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Durum</span>
            <select className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary" defaultValue={status} name="status">
              <option value="">Tümü</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="space-y-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Kategori</span>
            <select className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary" defaultValue={category} name="category">
              <option value="">Tümü</option>
              <option value="repair">Tamir</option>
              <option value="garage">Garaj</option>
              <option value="parts">Parça</option>
              <option value="dealer">Galeri</option>
              <option value="fuel">Yakıt</option>
              <option value="cafe">Kafe</option>
              <option value="other">Diğer</option>
            </select>
          </label>
          <div className="flex gap-sm md:col-span-2 xl:col-span-4">
            <Button type="submit">Filtrele</Button>
            <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary" href="/business/applications">
              Temizle
            </a>
          </div>
        </form>
        <BusinessApplicationsTable applications={filteredApplications} />
      </div>
    </PageShell>
  );
}
