import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { CommunityDetailGrid } from "@/components/communities/community-detail-grid";
import { CommunitySummaryCard } from "@/components/communities/community-summary-card";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { getAdminCommunityByIdOrMock } from "@/lib/admin-data";
import { mockCommunities } from "@/lib/mock-data";

export default async function CommunityDetailPage({ params }: { params: { id: string } }) {
  const { data: community, usingMockData } = await getAdminCommunityByIdOrMock(params.id, mockCommunities);

  if (!community) {
    notFound();
  }

  return (
    <PageShell
      eyebrow="Sprint 2 hazırlık"
      title="Topluluk detayı"
      description="Topluluk detayı gerçek üyelik ve flare kayıtları okunabildiğinde canlı veriyi gösterir."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href="/communities"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Topluluk listesine dön
      </Link>

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Topluluk detayı için gerçek kayıt okunamadı; örnek veri gösteriliyor."
        liveLabel="Topluluk özeti, üyeler ve flare akışı gerçek kayıtlardan okunuyor."
      />
      <CommunitySummaryCard community={community} />
      <CommunityDetailGrid community={community} />
    </PageShell>
  );
}
