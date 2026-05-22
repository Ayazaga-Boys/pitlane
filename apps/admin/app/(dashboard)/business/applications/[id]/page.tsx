import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminBusinessApplicationByIdOrMock } from "@/lib/admin-data";
import { mockBusinessApplications } from "@/lib/mock-data";
import { approveBusinessApplication, rejectBusinessApplication } from "../actions";

function mapStatus(status: "pending" | "under_review" | "approved" | "rejected") {
  if (status === "approved") return { label: "onaylandı", tone: "success" as const };
  if (status === "rejected") return { label: "reddedildi", tone: "error" as const };
  if (status === "under_review") return { label: "incelemede", tone: "info" as const };
  return { label: "bekliyor", tone: "warning" as const };
}

export default async function BusinessApplicationDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { result?: string };
}) {
  const { data: detail, usingMockData } = await getAdminBusinessApplicationByIdOrMock(params.id, mockBusinessApplications);
  if (!detail) notFound();

  const approveAction = approveBusinessApplication.bind(null, params.id);
  const status = mapStatus(detail.application.status);

  return (
    <PageShell
      eyebrow="V2.5 business onboarding"
      title="Başvuru detayı"
      description="İşletme başvurusunun belge, adres ve onay aksiyonlarını tek ekranda toplar."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href="/business/applications"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Başvuru kuyruğuna dön
      </Link>

      {searchParams?.result === "approved" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          Başvuru onaylandı, business location oluşturuldu ve kullanıcıya bildirim gönderildi.
        </div>
      ) : null}
      {searchParams?.result === "rejected" ? (
        <div className="rounded-md border border-error/30 bg-error/10 p-md text-sm leading-6 text-text-primary">
          Başvuru reddedildi ve kullanıcıya red nedeni gönderildi.
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Signed URL kontratı beklenirken belge metadata’larıyla örnek başvuru detayı gösteriliyor."
        liveLabel="Gerçek business application kaydı açık. Aksiyonlar doğrudan Supabase üzerinde çalışır."
      />

      <section className="surface-panel p-xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-md">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-pit-red-soft">Business application</p>
              <h2 className="mt-xs text-2xl font-semibold text-text-primary">{detail.application.businessName}</h2>
              <p className="mt-sm max-w-2xl text-sm leading-6 text-text-secondary">
                {detail.description ?? "Başvuru açıklaması girilmemiş. Belge ve adres kontrolüyle manuel değerlendirme yapılmalı."}
              </p>
            </div>

            <div className="flex flex-wrap gap-sm">
              <Badge tone={status.tone}>{status.label}</Badge>
              <Badge tone="default">{detail.application.category}</Badge>
              <Badge tone="default">{detail.application.applicantName}</Badge>
            </div>
          </div>

          <div className="grid gap-md rounded-md border border-surface-3 bg-surface-2 p-lg sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Başvuran</p>
              <p className="mt-xs text-sm text-text-primary">@{detail.application.applicantUsername}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Başvuru zamanı</p>
              <p className="mt-xs text-sm text-text-primary">{detail.application.createdAt}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">İnceleyen</p>
              <p className="mt-xs text-sm text-text-primary">{detail.reviewerLabel ?? "Henüz atanmadı"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Location kaydı</p>
              <p className="mt-xs text-sm text-text-primary">{detail.locationId ?? "Henüz oluşmadı"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-lg xl:grid-cols-[1fr_0.9fr]">
        <section className="space-y-lg">
          <section className="surface-panel p-xl">
            <h3 className="text-lg font-semibold text-text-primary">İşletme bilgileri</h3>
            <div className="mt-lg grid gap-md sm:grid-cols-2">
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Adres</p>
                <p className="mt-sm text-sm text-text-primary">{detail.application.address}</p>
              </div>
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Telefon</p>
                <p className="mt-sm text-sm text-text-primary">{detail.application.phone ?? "Telefon yok"}</p>
              </div>
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Website</p>
                <p className="mt-sm text-sm text-text-primary">{detail.application.website ?? "Website yok"}</p>
              </div>
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">H3 cell</p>
                <p className="mt-sm font-mono text-sm text-text-primary">{detail.h3Cell}</p>
              </div>
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Koordinat</p>
                <p className="mt-sm text-sm text-text-primary">
                  {detail.latitude.toFixed(5)}, {detail.longitude.toFixed(5)}
                </p>
              </div>
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Çalışma saatleri</p>
                <p className="mt-sm text-sm text-text-primary">{detail.workingHoursSummary}</p>
              </div>
            </div>
          </section>

          <section className="surface-panel p-xl">
            <h3 className="text-lg font-semibold text-text-primary">Belgeler</h3>
            <div className="mt-md rounded-md border border-warning/25 bg-warning/10 p-md text-sm leading-6 text-text-primary">
              {usingMockData
                ? "Signed URL kontratı hazır olmadığı için belgeler şimdilik metadata ve storage key üzerinden kontrol ediliyor."
                : "Belge preview endpoint'i aktifse aşağıdaki kartlardan 5 dakikalık signed URL ile doküman açılabilir. URL üretilemezse metadata fallback'i korunur."}
            </div>
            <div className="mt-md grid gap-md md:grid-cols-3">
              <div className="rounded-md border border-surface-3 bg-surface-2 p-md">
                <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">1. Dosya geldi mi?</p>
                <p className="mt-sm text-sm text-text-primary">`uploaded` durumundaki belgeler backend'e basarili ulasmis sayilir.</p>
              </div>
              <div className="rounded-md border border-surface-3 bg-surface-2 p-md">
                <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">2. Onizleme acik mi?</p>
                <p className="mt-sm text-sm text-text-primary">Signed URL gelene kadar storage key ve mime bilgisiyle manuel kontrol yapilir.</p>
              </div>
              <div className="rounded-md border border-surface-3 bg-surface-2 p-md">
                <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">3. Sonraki adim</p>
                <p className="mt-sm text-sm text-text-primary">Preview endpoint branch'e dustugunde bu karttan dogrudan belge acilacak.</p>
              </div>
            </div>
            <div className="mt-lg space-y-md">
              {detail.documents.length > 0 ? (
                detail.documents.map((document) => (
                  <div key={document.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                    <div className="flex flex-wrap items-center justify-between gap-md">
                      <div>
                        <p className="font-medium text-text-primary">{document.type}</p>
                        <p className="mt-1 text-xs text-text-tertiary">
                          {document.contentType} · {document.sizeLabel} · {document.createdAt}
                        </p>
                      </div>
                      <Badge tone={document.status === "uploaded" ? "success" : document.status === "rejected" ? "error" : "warning"}>
                        {document.status}
                      </Badge>
                    </div>
                    <div className="mt-md flex flex-wrap gap-xs">
                      <Badge tone={document.previewUrl ? "success" : "warning"}>
                        {document.previewUrl ? "preview hazır" : "signed URL bekleniyor"}
                      </Badge>
                      <Badge tone="default">metadata ile kontrol</Badge>
                    </div>
                    <div className="mt-md space-y-xs">
                      <p className="font-mono text-xs text-text-tertiary">{document.storageKey}</p>
                      <p className="text-xs text-text-tertiary">Preview durumu: {document.previewUrl ? "signed URL üretildi" : "signed URL bekleniyor"}</p>
                      <p className="text-xs text-text-tertiary">
                        Sonraki adım: {document.previewUrl ? "doküman linki 300 saniye boyunca açılabilir." : "backend signed preview yanıtı gelince bu karta direkt önizleme açılır."}
                      </p>
                    </div>
                    {document.previewUrl ? (
                      <div className="mt-md">
                        <a
                          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-md py-sm text-sm font-semibold text-text-primary"
                          href={document.previewUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Dokümanı önizle
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-surface-3 bg-surface-2 p-lg text-sm text-text-secondary">
                  Bu başvuruda belge görünmüyor.
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="space-y-lg">
          <section className="surface-panel overflow-hidden p-xl">
            <h3 className="text-lg font-semibold text-text-primary">Görsel önizleme</h3>
            <div className="mt-lg overflow-hidden rounded-md border border-surface-3 bg-surface-2">
              {detail.application.photoUrl ? (
                <img alt={`${detail.application.businessName} preview`} className="aspect-[4/3] w-full object-cover" src={detail.application.photoUrl} />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center p-xl text-sm text-text-secondary">Foto preview yok</div>
              )}
            </div>
          </section>

          <section className="surface-panel p-xl">
            <h3 className="text-lg font-semibold text-text-primary">Onay aksiyonları</h3>
            {detail.application.rejectionReason ? (
              <div className="mt-md rounded-md border border-error/20 bg-error/5 p-md text-sm leading-6 text-text-primary">
                Red nedeni: {detail.application.rejectionReason}
              </div>
            ) : null}

            <div className="mt-lg grid gap-md">
              <form action={approveAction}>
                <Button className="w-full" disabled={usingMockData || detail.application.status === "approved"} type="submit">
                  {detail.application.status === "approved" ? "Zaten onaylandı" : "Başvuruyu onayla"}
                </Button>
              </form>

              <form action={rejectBusinessApplication} className="space-y-md">
                <input name="applicationId" type="hidden" value={params.id} />
                <label className="space-y-sm block">
                  <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Red nedeni</span>
                  <textarea
                    className="focus-ring min-h-28 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                    defaultValue={detail.application.rejectionReason ?? "Eksik veya okunaksız belge nedeniyle başvuru şu aşamada onaylanamadı."}
                    name="reason"
                  />
                </label>
                <Button className="w-full" disabled={usingMockData || detail.application.status === "rejected"} type="submit" variant="destructive">
                  {detail.application.status === "rejected" ? "Zaten reddedildi" : "Başvuruyu reddet"}
                </Button>
              </form>
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
}
