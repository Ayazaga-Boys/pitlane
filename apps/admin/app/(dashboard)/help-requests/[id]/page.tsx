import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/dashboard/page-shell";
import { getAdminHelpRequestsOrMock } from "@/lib/admin-data";
import { mockHelpRequests } from "@/lib/mock-data";
import { removeHelpRequestAction } from "./actions";

function issueTypeLabel(issueType: "breakdown" | "flat_tire" | "fuel" | "accident" | "other") {
  switch (issueType) {
    case "breakdown":
      return "Arıza";
    case "flat_tire":
      return "Lastik";
    case "fuel":
      return "Yakıt";
    case "accident":
      return "Kaza";
    default:
      return "Diğer";
  }
}

function statusTone(status: "open" | "matched" | "resolved" | "cancelled") {
  switch (status) {
    case "open":
      return "warning";
    case "matched":
      return "info";
    case "resolved":
      return "success";
    default:
      return "default";
  }
}

function statusLabel(status: "open" | "matched" | "resolved" | "cancelled") {
  switch (status) {
    case "open":
      return "Açık";
    case "matched":
      return "Eşleşti";
    case "resolved":
      return "Çözüldü";
    default:
      return "İptal";
  }
}

export default async function HelpRequestDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { result?: string };
}) {
  const { data: requests, usingMockData } = await getAdminHelpRequestsOrMock(mockHelpRequests);
  const request = requests.find((item) => item.id === params.id);

  if (!request) {
    notFound();
  }

  return (
    <PageShell
      eyebrow="Sprint 5 hazırlık"
      title={`${request.requesterLabel} yardım talebi`}
      description="Yardım talebi detayını, durumunu ve moderasyon/operasyon notlarını buradan takip edebilirsin."
    >
      {searchParams?.result === "removed" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          Yardım talebi kaldırıldı.
        </div>
      ) : null}

      <div className="grid gap-lg xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <section className="surface-panel p-xl">
          <div className="flex flex-wrap items-center gap-sm">
            <Badge tone="default">{issueTypeLabel(request.issueType)}</Badge>
            <Badge tone={statusTone(request.status)}>{statusLabel(request.status)}</Badge>
            {usingMockData ? <Badge tone="warning">demo kayıt</Badge> : <Badge tone="success">canlı veri</Badge>}
          </div>

          <div className="mt-lg space-y-lg">
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Talep özeti</p>
              <p className="mt-sm text-base leading-7 text-text-primary">{request.note}</p>
            </div>

            <div className="grid gap-md md:grid-cols-2">
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Talep eden</p>
                <p className="mt-sm text-sm font-medium text-text-primary">{request.requesterLabel}</p>
              </div>
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">Zaman</p>
                <p className="mt-sm text-sm font-medium text-text-primary">{request.createdAt}</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Operasyon notu</h2>
          <p className="mt-sm text-sm leading-6 text-text-secondary">
            Bu alan Sprint 5 sonunda gerçek yardım operasyon aksiyonlarıyla genişleyecek. Şimdilik yardım tipini,
            mevcut durumu ve kayıt zamanını hızlıca okumak için kullanılıyor.
          </p>

          <div className="mt-lg rounded-md border border-surface-3 bg-surface-2 p-lg text-sm leading-6 text-text-secondary">
            Gerçek eşleşme/çözüm akışı geldiğinde bu kartta operatör notu, yardım eden kullanıcı ve kapanış özeti de
            görünecek.
          </div>

          <form action={removeHelpRequestAction.bind(null, params.id)} className="mt-lg">
            <Button className="w-full" disabled={usingMockData} type="submit" variant="destructive">
              {usingMockData ? "Demo kaydı kaldırılamaz" : "Talebi kaldır"}
            </Button>
          </form>
        </aside>
      </div>
    </PageShell>
  );
}
