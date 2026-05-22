import { Badge } from "@/components/ui/badge";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { getAdminExportRequestsOrMock } from "@/lib/admin-data";
import { mockExportRequests } from "@/lib/mock-data";
import { Table, TableWrapper, TBody, TD, TH, THead, TR } from "@/components/ui/table";

function statusTone(status: "queued" | "processing" | "ready" | "expired" | "failed") {
  switch (status) {
    case "ready":
      return "success" as const;
    case "processing":
      return "info" as const;
    case "queued":
      return "warning" as const;
    case "expired":
    case "failed":
      return "error" as const;
  }
}

function statusLabel(status: "queued" | "processing" | "ready" | "expired" | "failed") {
  switch (status) {
    case "queued":
      return "Sırada";
    case "processing":
      return "Hazırlanıyor";
    case "ready":
      return "İndirilebilir";
    case "expired":
      return "Süresi doldu";
    case "failed":
      return "Başarısız";
  }
}

function channelLabel(channel: "app" | "support") {
  return channel === "app" ? "Uygulama içi" : "Destek hattı";
}

export default async function DataExportsPage() {
  const { data: requests, usingMockData } = await getAdminExportRequestsOrMock(mockExportRequests);
  const readyCount = requests.filter((request) => request.status === "ready").length;
  const waitingCount = requests.filter((request) => request.status === "queued" || request.status === "processing").length;

  return (
    <PageShell
      eyebrow="Sprint 5 hazırlık"
      title="Veri talepleri"
      description="KVKK ve GDPR kapsamındaki dışa aktarma taleplerinin hazırlanma ve teslim durumunu buradan izlersin."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Canlı export job verisi bulunamadı; ekran örnek GDPR talepleriyle test modunda."
        liveLabel="Veri dışa aktarma talepleri canlı yapılandırmadan okunuyor."
      />

      <div className="grid gap-md md:grid-cols-2 xl:grid-cols-4">
        <article className="surface-panel p-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Toplam talep</p>
          <p className="mt-sm text-4xl font-semibold text-text-primary">{requests.length}</p>
        </article>
        <article className="surface-panel p-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Hazırlanan arşiv</p>
          <p className="mt-sm text-4xl font-semibold text-text-primary">{readyCount}</p>
        </article>
        <article className="surface-panel p-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Bekleyen iş</p>
          <p className="mt-sm text-4xl font-semibold text-text-primary">{waitingCount}</p>
        </article>
        <article className="surface-panel p-lg">
          <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Yasal hatırlatma</p>
          <p className="mt-sm text-sm leading-6 text-text-primary">Kullanıcı taleplerine 30 gün içinde dönüş yapılmalı.</p>
        </article>
      </div>

      <section className="surface-panel mt-lg p-xl">
        <div className="flex items-center justify-between gap-md">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Dışa aktarma kuyruğu</h2>
            <p className="mt-sm text-sm leading-6 text-text-secondary">
              Talebin hangi kanaldan geldiği, ne zaman hazır olduğu ve indirme penceresi burada izlenir.
            </p>
          </div>
          <Badge tone={usingMockData ? "warning" : "success"}>{usingMockData ? "mock" : "live"}</Badge>
        </div>

        <div className="mt-lg">
          <TableWrapper>
            <Table>
              <THead>
                <TR>
                  <TH>Talep</TH>
                  <TH>Kanal</TH>
                  <TH>Durum</TH>
                  <TH>İstendi</TH>
                  <TH>Hazır oldu</TH>
                  <TH>İndirme süresi</TH>
                </TR>
              </THead>
              <TBody>
                {requests.map((request) => (
                  <TR key={request.id}>
                    <TD>
                      <div className="font-medium text-text-primary">{request.requesterLabel}</div>
                      <div className="mt-xs text-xs uppercase tracking-[0.16em] text-text-tertiary">{request.id}</div>
                    </TD>
                    <TD>{channelLabel(request.channel)}</TD>
                    <TD>
                      <Badge tone={statusTone(request.status)}>{statusLabel(request.status)}</Badge>
                    </TD>
                    <TD>{request.requestedAt}</TD>
                    <TD>{request.readyAt ?? "Henüz hazır değil"}</TD>
                    <TD>{request.expiresAt ?? "Süre başlamadı"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrapper>
        </div>
      </section>
    </PageShell>
  );
}
