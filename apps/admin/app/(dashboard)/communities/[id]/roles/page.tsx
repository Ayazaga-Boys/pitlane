import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { getAdminCommunityByIdOrMock } from "@/lib/admin-data";
import { mockCommunities } from "@/lib/mock-data";

export default async function CommunityRolesPage({ params }: { params: { id: string } }) {
  const { data: community, usingMockData } = await getAdminCommunityByIdOrMock(params.id, mockCommunities);
  if (!community) notFound();

  return (
    <PageShell
      eyebrow="V2.4 rol görünürlüğü"
      title={`${community.name} roller`}
      description="Topluluktaki özel rol tanımlarını ve üyelerin hangi role bağlı olduğunu admin görünümünde toplar."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href={`/communities/${params.id}`}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Topluluk detayına dön
      </Link>

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Rol görünümü için örnek community role verisi gösteriliyor."
        liveLabel="Topluluk rolleri ve üye atamaları gerçek kayıtlardan okunuyor."
      />

      <div className="grid gap-lg xl:grid-cols-[0.45fr_0.55fr]">
        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Rol tanımları</h3>
          <div className="mt-lg space-y-md">
            {community.customRoles.length > 0 ? (
              community.customRoles.map((role) => (
                <div key={role.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                  <div className="flex flex-wrap items-center justify-between gap-md">
                    <div>
                      <p className="font-medium text-text-primary">{role.name}</p>
                      <p className="mt-1 text-xs text-text-tertiary">Sıra: {role.rankOrder}</p>
                    </div>
                    <Badge tone="info">{role.assignedCount} atama</Badge>
                  </div>
                  <div className="mt-md flex flex-wrap gap-xs">
                    {role.permissions.length > 0 ? (
                      role.permissions.map((permission) => (
                        <Badge key={permission} tone="default">
                          {permission}
                        </Badge>
                      ))
                    ) : (
                      <Badge tone="default">özel yetki yok</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-surface-3 bg-surface-2 p-lg text-sm text-text-secondary">
                Bu toplulukta henüz özel role tanımı bulunmuyor.
              </div>
            )}
          </div>
        </section>

        <section className="surface-panel p-xl">
          <h3 className="text-lg font-semibold text-text-primary">Üye atamaları</h3>
          <div className="mt-lg space-y-md">
            {community.memberList.map((member) => (
              <div key={member.id} className="rounded-md border border-surface-3 bg-surface-2 p-lg">
                <div className="flex flex-wrap items-center justify-between gap-md">
                  <div>
                    <p className="font-medium text-text-primary">{member.name}</p>
                    <p className="mt-1 text-xs text-text-tertiary">Legacy rol: {member.role}</p>
                  </div>
                  <Badge tone={member.assignedRole ? "success" : "default"}>{member.assignedRole ?? "özel rol yok"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
