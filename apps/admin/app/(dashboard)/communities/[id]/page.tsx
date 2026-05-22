import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { CommunityDetailGrid } from "@/components/communities/community-detail-grid";
import { CommunitySummaryCard } from "@/components/communities/community-summary-card";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { getAdminCommunityByIdOrMock } from "@/lib/admin-data";
import { mockCommunities } from "@/lib/mock-data";
import { deleteCommunityAction } from "./actions";

export default async function CommunityDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { result?: string };
}) {
  const { data: community, usingMockData } = await getAdminCommunityByIdOrMock(params.id, mockCommunities);

  if (!community) {
    notFound();
  }

  const deleteAction = deleteCommunityAction.bind(null, params.id);

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

      {searchParams?.result === "deleted" ? (
        <div className="rounded-md border border-error/30 bg-error/10 p-md text-sm leading-6 text-text-primary">
          Topluluk silindi ve audit log kaydı oluşturuldu.
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Topluluk detayı için gerçek kayıt okunamadı; örnek veri gösteriliyor."
        liveLabel="Topluluk özeti, üyeler ve flare akışı gerçek kayıtlardan okunuyor."
      />
      <CommunitySummaryCard community={community} />
      <section className="surface-panel p-xl">
        <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Topluluk aksiyonları</h3>
            <p className="mt-sm text-sm leading-6 text-text-secondary">
              Bu aksiyon topluluk kaydını ve ilişkili üyelikleri siler. Gerçek veri açık değilse buton pasif kalır.
            </p>
          </div>
          <div className="flex flex-wrap gap-sm">
            <Link href={`/communities/${params.id}/roles`}>
              <Button type="button" variant="secondary">
                Rolleri görüntüle
              </Button>
            </Link>
            <form action={deleteAction}>
              <Button disabled={usingMockData} type="submit" variant="destructive">
                Topluluğu sil
              </Button>
            </form>
          </div>
        </div>
      </section>
      <CommunityDetailGrid community={community} />
    </PageShell>
  );
}
