import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { UserDetailGrid } from "@/components/users/user-detail-grid";
import { UserSummaryCard } from "@/components/users/user-summary-card";
import { getAdminUserByIdOrMock } from "@/lib/admin-data";
import { mockUsers } from "@/lib/mock-data";

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const { data: user, usingMockData } = await getAdminUserByIdOrMock(params.id, mockUsers);

  if (!user) {
    notFound();
  }

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

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Detay ekranı için gerçek kullanıcı verisi bulunamadı; örnek kayıt gösteriliyor."
        liveLabel="Kullanıcı profili, araçlar ve ilişkili topluluk kayıtları gerçek veriden geliyor."
      />
      <UserSummaryCard user={user} />
      <UserDetailGrid user={user} />
    </PageShell>
  );
}
