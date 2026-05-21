import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockCompetitions } from "@/lib/mock-data";

function mapStatus(status: "draft" | "voting" | "completed" | "canceled") {
  if (status === "voting") return { label: "oylama", tone: "success" as const };
  if (status === "completed") return { label: "tamamlandı", tone: "default" as const };
  if (status === "canceled") return { label: "iptal", tone: "error" as const };
  return { label: "taslak", tone: "warning" as const };
}

export default function CompetitionDetailPage({ params }: { params: { id: string } }) {
  const competition = mockCompetitions.find((entry) => entry.id === params.id);
  if (!competition) notFound();

  const status = mapStatus(competition.status);

  return (
    <PageShell
      eyebrow="V2.6 yarışma operasyonu"
      title="Yarışma detayı"
      description="Backend kontratı tamamlanana kadar yarışma metriklerini ve moderasyon hazırlığını mock veri üzerinden takip eder."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href="/competitions"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Yarışma listesine dön
      </Link>

      <DataStateBanner
        usingMockData
        mockLabel="Entry ve vote endpoint’leri tamamlanmadığı için detay ekranı mock operasyon görünümünde."
        liveLabel=""
      />

      <section className="surface-panel p-xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-md">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-pit-red-soft">{competition.communityName}</p>
              <h2 className="mt-xs text-2xl font-semibold text-text-primary">{competition.title}</h2>
              <p className="mt-sm max-w-2xl text-sm leading-6 text-text-secondary">{competition.moderationNote}</p>
            </div>
            <div className="flex flex-wrap gap-sm">
              <Badge tone={status.tone}>{status.label}</Badge>
              <Badge tone="default">{competition.filtersSummary}</Badge>
              <Badge tone={competition.suspicious ? "warning" : "default"}>
                {competition.suspicious ? "şüpheli akış" : "normal akış"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-md rounded-md border border-surface-3 bg-surface-2 p-lg sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Başlangıç</p>
              <p className="mt-xs text-sm text-text-primary">{competition.startsAt}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Bitiş</p>
              <p className="mt-xs text-sm text-text-primary">{competition.endsAt}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Entry</p>
              <p className="mt-xs text-sm text-text-primary">{competition.entriesCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Oy</p>
              <p className="mt-xs text-sm text-text-primary">{competition.votesCount}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-lg xl:grid-cols-[0.7fr_0.3fr]">
        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Öne çıkan entry’ler</h3>
          <div className="mt-lg space-y-md">
            {competition.topEntries.length > 0 ? (
              competition.topEntries.map((entry) => (
                <div key={entry.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                  <div className="flex flex-wrap items-center justify-between gap-md">
                    <div>
                      <p className="font-medium text-text-primary">{entry.title}</p>
                      <p className="mt-1 text-xs text-text-tertiary">{entry.votes} oy</p>
                    </div>
                    <div className="flex gap-xs">
                      <Badge tone="info">entry</Badge>
                      {entry.flagged ? <Badge tone="warning">incele</Badge> : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg text-sm text-text-secondary">
                Henüz entry görünmüyor. Backend kontratı tamamlandığında gerçek liste burada akacak.
              </div>
            )}
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Moderasyon aksiyonları</h3>
          <p className="mt-md text-sm leading-6 text-text-secondary">
            İptal, entry reddetme ve oy temizleme aksiyonları için backend endpoint bekleniyor. Bu ekran operasyon kararını hazırlamak için açık.
          </p>
          <div className="mt-lg grid gap-md">
            <Button className="w-full" disabled type="button" variant="secondary">
              Yarışmayı iptal et
            </Button>
            <Button className="w-full" disabled type="button" variant="ghost">
              Şüpheli entry’leri ayıkla
            </Button>
            <Button className="w-full" disabled type="button" variant="destructive">
              Oylamayı durdur
            </Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
