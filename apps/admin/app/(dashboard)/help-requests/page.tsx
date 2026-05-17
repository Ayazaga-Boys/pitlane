import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { HelpRequestsTable } from "@/components/help/help-requests-table";
import { getAdminHelpRequestsOrMock } from "@/lib/admin-data";
import { mockHelpRequests } from "@/lib/mock-data";

export default async function HelpRequestsPage({
  searchParams,
}: {
  searchParams?: { result?: string };
}) {
  const { data: requests, usingMockData } = await getAdminHelpRequestsOrMock(mockHelpRequests);

  return (
    <PageShell
      eyebrow="Sprint 5 hazırlık"
      title="Yardım talepleri"
      description="Açık ve geçmiş yardım talepleri mümkün olduğunda gerçek `help_requests` tablosundan, aksi durumda demo kayıtlarla izlenir."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek yardım talebi kayıtları okunamadı; test için örnek yardım kuyruğu gösteriliyor."
        liveLabel="Yardım talebi kuyruğu gerçek Supabase verisinden okunuyor."
      />

      {searchParams?.result === "removed" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          Yardım talebi kaldırıldı ve audit kaydı oluşturuldu.
        </div>
      ) : null}

      <div className="surface-panel p-xl">
        <HelpRequestsTable requests={requests} />
      </div>
    </PageShell>
  );
}
