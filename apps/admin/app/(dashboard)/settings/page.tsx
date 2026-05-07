import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { mockFlags } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <PageShell
      eyebrow="Sprint 5 hazirlik"
      title="Ayarlar"
      description="Feature flag sayfasinin ilk duzeni ve durum etiketleri olusturuldu."
    >
      <MockDataBanner label="Remote config tablosu baglanana kadar ornek feature flag listesi aktif" />
      <div className="surface-panel p-xl">
        <div className="space-y-md">
          {mockFlags.map((flag) => (
            <div
              key={flag.key}
              className="flex flex-col gap-md rounded-md border border-surface-3 bg-surface-2 p-lg md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium text-text-primary">{flag.key}</p>
                <p className="mt-xs text-sm text-text-secondary">{flag.description}</p>
              </div>
              <Badge tone={flag.enabled ? "success" : "warning"}>{flag.enabled ? "enabled" : "disabled"}</Badge>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
