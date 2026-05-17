import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminPinDetailOrMock } from "@/lib/admin-data";
import { mockPins } from "@/lib/mock-data";
import { rejectBusinessPinAction, verifyBusinessPinAction } from "./actions";

function mapCategory(category: string) {
  switch (category) {
    case "repair":
      return "Tamir";
    case "fuel":
      return "Yakıt";
    case "cafe":
      return "Kafe";
    case "garage":
      return "Garaj";
    case "parts":
      return "Parça";
    default:
      return "Diğer";
  }
}

function statusBadge(status: "pending" | "verified" | "rejected") {
  if (status === "verified") {
    return { label: "doğrulandı", tone: "success" as const };
  }

  if (status === "rejected") {
    return { label: "reddedildi", tone: "error" as const };
  }

  return { label: "bekliyor", tone: "warning" as const };
}

function buildRejectionTemplate(name: string) {
  return [
    `Merhaba ${name},`,
    "",
    "İşletme pin başvurunu inceledik ancak mevcut bilgilerle doğrulama tamamlanamadı.",
    "Lütfen adres, telefon veya işletme sahipliği belgelerini güncelleyip tekrar başvur.",
    "",
    "Rollpit Admin",
  ].join("\n");
}

export default async function PinVerifyPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { result?: string };
}) {
  const { data: detail, usingMockData } = await getAdminPinDetailOrMock(params.id, mockPins);

  if (!detail) {
    notFound();
  }

  const badge = statusBadge(detail.pin.status);
  const verifyAction = verifyBusinessPinAction.bind(null, params.id);
  const rejectAction = rejectBusinessPinAction.bind(null, params.id);
  const rejectionTemplate = buildRejectionTemplate(detail.pin.owner);

  return (
    <PageShell
      eyebrow="Sprint 3 hazırlık"
      title="Pin doğrulama"
      description="İşletme pin kaydını inceleyip doğrulama veya reddetme aksiyonunu server action üzerinden uygular."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href="/pins"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Pin listesine dön
      </Link>

      {searchParams?.result === "verified" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          Pin doğrulandı ve audit log kaydı yazıldı.
        </div>
      ) : null}
      {searchParams?.result === "rejected" ? (
        <div className="rounded-md border border-error/30 bg-error/10 p-md text-sm leading-6 text-text-primary">
          Pin reddedildi, pasife alındı ve audit log kaydı yazıldı.
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Service-role veya gerçek pin kaydı okunamadı; bu sayfada örnek veri gösteriliyor."
        liveLabel="Gerçek business_pins kaydı açık. Aşağıdaki aksiyonlar doğrudan Supabase üzerinde çalışır."
      />

      <section className="surface-panel p-xl">
        <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-md">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-pit-red-soft">İşletme pin inceleme</p>
              <h2 className="mt-xs text-2xl font-semibold text-text-primary">{detail.pin.name}</h2>
              <p className="mt-sm max-w-2xl text-sm leading-6 text-text-secondary">
                {detail.ownerBio ?? "İşletme sahibi için ek profil notu bulunmuyor. Adres ve iletişim bilgileri üzerinden manuel doğrulama yapabilirsin."}
              </p>
            </div>

            <div className="flex flex-wrap gap-sm">
              <Badge tone={badge.tone}>{badge.label}</Badge>
              <Badge tone="default">{mapCategory(detail.pin.category)}</Badge>
              <Badge tone="default">{detail.pin.owner}</Badge>
            </div>
          </div>

          <div className="grid gap-md rounded-md border border-surface-3 bg-surface-2 p-lg sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Sahip kullanıcı</p>
              <p className="mt-xs text-sm text-text-primary">{detail.ownerUsername ? `@${detail.ownerUsername}` : detail.pin.owner}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Başvuru tarihi</p>
              <p className="mt-xs text-sm text-text-primary">{detail.createdAtLabel}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Konum</p>
              <p className="mt-xs text-sm text-text-primary">{detail.address ?? "Adres girilmemiş"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">İletişim</p>
              <p className="mt-xs text-sm text-text-primary">{detail.phone ?? "Telefon yok"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-lg xl:grid-cols-[1fr_0.85fr]">
        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Doğrulama notları</h3>
          <div className="mt-lg grid gap-md">
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Website</p>
              <p className="mt-sm text-sm text-text-primary">{detail.website ?? "Website kaydı yok"}</p>
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Mevcut operasyon kararı</p>
              <p className="mt-sm text-sm leading-6 text-text-secondary">
                Doğrulama aksiyonu pin kaydını aktif ve doğrulanmış duruma getirir. Reddet aksiyonu ise kaydı pasife alır ve tekrar gözden
                geçirilene kadar listede reddedildi olarak görünmesini sağlar.
              </p>
            </div>
            <div className="rounded-md border border-surface-3 bg-surface-2 p-lg">
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Standart red e-postası</p>
              <pre className="mt-sm whitespace-pre-wrap text-sm leading-6 text-text-secondary">{rejectionTemplate}</pre>
            </div>
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Aksiyonlar</h3>
          <p className="mt-md text-sm leading-6 text-text-secondary">
            Bu bölüm sadece gerçek veri açıkken işlem uygular. Her aksiyon sonrası `audit_logs` tablosuna yönetici kaydı yazılır.
          </p>

          <div className="mt-lg flex flex-col gap-md">
            <form action={verifyAction}>
              <Button className="w-full" disabled={usingMockData || detail.pin.status === "verified"} type="submit">
                {detail.pin.status === "verified" ? "Zaten doğrulandı" : "Pini doğrula"}
              </Button>
            </form>
            <form action={rejectAction}>
              <Button className="w-full" disabled={usingMockData || detail.pin.status === "rejected"} type="submit" variant="destructive">
                {detail.pin.status === "rejected" ? "Zaten reddedildi" : "Pini reddet"}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
