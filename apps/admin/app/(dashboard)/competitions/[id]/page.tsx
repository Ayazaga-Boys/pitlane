import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminCompetitionByIdOrMock } from "@/lib/admin-data";
import { mockCompetitions } from "@/lib/mock-data";
import { cancelCompetition, pauseCompetitionVoting, rejectCompetitionEntry } from "./actions";

function mapStatus(status: "draft" | "voting" | "completed" | "canceled") {
  if (status === "voting") return { label: "oylama", tone: "success" as const };
  if (status === "completed") return { label: "tamamlandı", tone: "default" as const };
  if (status === "canceled") return { label: "iptal", tone: "error" as const };
  return { label: "taslak", tone: "warning" as const };
}

export default async function CompetitionDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { result?: string };
}) {
  const { data: competition, usingMockData } = await getAdminCompetitionByIdOrMock(params.id, mockCompetitions);
  if (!competition) notFound();

  const status = mapStatus(competition.status);
  const cancelAction = cancelCompetition;
  const pauseAction = pauseCompetitionVoting;
  const rejectEntryAction = rejectCompetitionEntry;

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

      {searchParams?.result === "canceled" ? (
        <div className="rounded-md border border-error/30 bg-error/10 p-md text-sm leading-6 text-text-primary">
          Yarışma admin override ile iptal edildi ve audit log’a işlendi.
        </div>
      ) : null}
      {searchParams?.result === "paused" ? (
        <div className="rounded-md border border-warning/30 bg-warning/10 p-md text-sm leading-6 text-text-primary">
          Oylama geçici olarak durduruldu. Karar audit log üzerinde saklanıyor.
        </div>
      ) : null}
      {searchParams?.result === "entry_rejected" ? (
        <div className="rounded-md border border-warning/30 bg-warning/10 p-md text-sm leading-6 text-text-primary">
          Seçilen entry reddedildi ve liste üzerinde bloklu olarak işaretlendi.
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Entry ve vote endpoint’leri tamamlanmadığı için detay ekranı mock veriyle çalışıyor; admin override aksiyonları audit log’dan geri okunuyor."
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
              {competition.adminActionLabel ? <Badge tone="info">{competition.adminActionLabel}</Badge> : null}
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
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Bloklu entry</p>
              <p className="mt-xs text-sm text-text-primary">{competition.blockedEntriesCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Son admin aksiyonu</p>
              <p className="mt-xs text-sm text-text-primary">{competition.adminActionAt ?? "Henüz yok"}</p>
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
                      {entry.rejectedByAdmin ? <Badge tone="error">reddedildi</Badge> : null}
                    </div>
                  </div>
                  {entry.rejectedByAdmin ? (
                    <p className="mt-md text-sm leading-6 text-text-secondary">
                      {entry.rejectionReason ?? "Bu entry admin override ile reddedildi."}
                      {entry.rejectedAt ? ` · ${entry.rejectedAt}` : ""}
                    </p>
                  ) : null}
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
            Backend yarışma kontratı beklenirken bu aksiyonlar audit tabanlı admin override olarak kaydedilir ve sayfaya geri yansır.
          </p>
          <div className="mt-md rounded-md border border-warning/25 bg-warning/10 p-md text-sm leading-6 text-text-primary">
            Hazır olanlar: iptal, oylamayı durdur, entry reddet, audit izi.
            Bekleyenler: gerçek katılımcı medyası, oy kırılımı ve backend vote temizleme endpoint'i.
          </div>
          <div className="mt-lg grid gap-md">
            <form action={cancelAction} className="space-y-sm">
              <input name="competitionId" type="hidden" value={competition.id} />
              <label className="block space-y-sm">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">İptal nedeni</span>
                <textarea
                  className="focus-ring min-h-24 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  defaultValue="Manipülatif oy veya kural dışı akış nedeniyle yarışma iptal edildi."
                  name="reason"
                />
              </label>
              <Button className="w-full" type="submit" variant="destructive">
                Yarışmayı iptal et
              </Button>
            </form>

            <form action={pauseAction} className="space-y-sm">
              <input name="competitionId" type="hidden" value={competition.id} />
              <label className="block space-y-sm">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Durdurma nedeni</span>
                <textarea
                  className="focus-ring min-h-24 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  defaultValue="Ani oy sıçraması nedeniyle oylama manuel incelemeye alındı."
                  name="reason"
                />
              </label>
              <Button className="w-full" disabled={competition.status !== "voting"} type="submit" variant="secondary">
                {competition.status === "voting" ? "Oylamayı durdur" : "Oylama aktif değil"}
              </Button>
            </form>

            <form action={rejectEntryAction} className="space-y-sm">
              <input name="competitionId" type="hidden" value={competition.id} />
              <label className="block space-y-sm">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Reddedilecek entry</span>
                <select
                  className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  defaultValue=""
                  name="entryId"
                >
                  <option disabled value="">
                    Entry seç
                  </option>
                  {competition.topEntries
                    .filter((entry) => !entry.rejectedByAdmin)
                    .map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.title}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block space-y-sm">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Reddetme nedeni</span>
                <textarea
                  className="focus-ring min-h-24 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  defaultValue="Entry yarışma kurallarını karşılamadığı için admin tarafından reddedildi."
                  name="reason"
                />
              </label>
              <Button className="w-full" disabled={competition.topEntries.every((entry) => entry.rejectedByAdmin)} type="submit" variant="ghost">
                {competition.topEntries.every((entry) => entry.rejectedByAdmin) ? "Reddedilecek entry kalmadı" : "Entry reddet"}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
