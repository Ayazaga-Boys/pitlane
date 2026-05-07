import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { PinsTable } from "@/components/pins/pins-table";
import { mockPins } from "@/lib/mock-data";

export default function PinsPage() {
  return (
    <PageShell
      eyebrow="Sprint 3 hazirlik"
      title="Isletme pinleri"
      description="Pin dogrulama kuyrugunun tablo duzeni, durum etiketleri ve inceleme akisi mock veriyle kuruldu."
    >
      <MockDataBanner label="Business pins tablosu hazir olmayinca mock basvurular gosteriliyor" />
      <div className="surface-panel p-xl">
        <PinsTable pins={mockPins} />
      </div>
    </PageShell>
  );
}
