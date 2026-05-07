import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { PinsTable } from "@/components/pins/pins-table";
import { mockPins } from "@/lib/mock-data";

export default function PinsPage() {
  return (
    <PageShell
      eyebrow="Sprint 3 hazırlık"
      title="İşletme pinleri"
      description="Pin doğrulama kuyruğunun tablo düzeni, durum etiketleri ve inceleme akışı mock veriyle kuruldu."
    >
      <MockDataBanner label="İşletme pinleri tablosu hazır olmayınca mock başvurular gösteriliyor" />
      <div className="surface-panel p-xl">
        <PinsTable pins={mockPins} />
      </div>
    </PageShell>
  );
}
