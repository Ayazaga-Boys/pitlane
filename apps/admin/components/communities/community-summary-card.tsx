import { Badge } from "@/components/ui/badge";
import type { MockCommunity } from "@/lib/mock-data";

function mapCommunityType(type: MockCommunity["type"]) {
  if (type === "public") return { label: "açık", tone: "success" as const };
  if (type === "private") return { label: "özel", tone: "warning" as const };
  return { label: "gizli", tone: "error" as const };
}

function mapVehicleType(type: MockCommunity["vehicleType"]) {
  if (type === "car") return "otomobil";
  if (type === "motorcycle") return "motosiklet";
  return "tümü";
}

export function CommunitySummaryCard({ community }: { community: MockCommunity }) {
  const typeBadge = mapCommunityType(community.type);

  return (
    <section className="surface-panel p-xl">
      <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-md">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-pit-red-soft">/{community.slug}</p>
            <h2 className="mt-xs text-2xl font-semibold text-text-primary">{community.name}</h2>
            <p className="mt-sm max-w-2xl text-sm leading-6 text-text-secondary">{community.description}</p>
          </div>

          <div className="flex flex-wrap gap-sm">
            <Badge tone={typeBadge.tone}>{typeBadge.label}</Badge>
            <Badge tone="default">{community.city}</Badge>
            <Badge tone="default">{mapVehicleType(community.vehicleType)}</Badge>
          </div>
        </div>

        <div className="grid gap-md rounded-md border border-surface-3 bg-surface-2 p-lg sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Kuruluş</p>
            <p className="mt-xs text-sm text-text-primary">{community.foundedAt}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Üye sayısı</p>
            <p className="mt-xs text-sm text-text-primary">{community.members}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Kaptan</p>
            <p className="mt-xs text-sm text-text-primary">{community.captain}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Aktif flare</p>
            <p className="mt-xs text-sm text-text-primary">{community.activeFlares.length}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
