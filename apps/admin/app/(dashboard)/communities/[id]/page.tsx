import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { CommunityDetailGrid } from "@/components/communities/community-detail-grid";
import { CommunitySummaryCard } from "@/components/communities/community-summary-card";
import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { getMockCommunityById } from "@/lib/mock-data";

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const community = getMockCommunityById(params.id);

  if (!community) {
    notFound();
  }

  return (
    <PageShell
      eyebrow="Sprint 2 hazırlık"
      title="Topluluk detayı"
      description="Gerçek topluluk tabloları gelene kadar bu ekran moderasyon, üye görünümü ve flare akışını mock veriyle prova eder."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href="/communities"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Topluluk listesine dön
      </Link>

      <MockDataBanner label="Detay ekranı şu an örnek topluluk verisiyle besleniyor" />
      <CommunitySummaryCard community={community} />
      <CommunityDetailGrid community={community} />
    </PageShell>
  );
}
