import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminRemoteConfigsOrMock } from "@/lib/admin-data";
import { mockFlags } from "@/lib/mock-data";
import { updateRemoteConfig } from "./actions";
import { SaveToast } from "./save-toast";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { result?: string; key?: string; message?: string };
}) {
  const { data: configs, usingMockData } = await getAdminRemoteConfigsOrMock(mockFlags);

  return (
    <PageShell
      eyebrow="Sprint 5 hazırlık"
      title="Ayarlar"
      description="Özellik açma-kapama ve minimum uygulama sürümü ayarları mümkün olduğunda canlı yapılandırmadan yönetilir."
    >
      <SaveToast
        configKey={searchParams?.key}
        message={searchParams?.message ? decodeURIComponent(searchParams.message) : undefined}
        result={searchParams?.result}
      />

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Canlı ayarlar okunamadı; test için örnek ayar listesi gösteriliyor."
        liveLabel="Ayarlar canlı yapılandırmadan okunuyor."
      />

      <div className="surface-panel p-xl">
        <div className="space-y-md">
          {configs.map((config) => (
            <form
              key={config.key}
              action={updateRemoteConfig}
              className="flex flex-col gap-md rounded-md border border-surface-3 bg-surface-2 p-lg"
            >
              <input name="key" type="hidden" value={config.key} />
              <input name="type" type="hidden" value={config.type} />

              <div className="flex flex-col gap-md md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-sm">
                    <p className="font-medium text-text-primary">{config.key}</p>
                    <Badge tone={config.type === "flag" ? "info" : config.type === "number" ? "warning" : "default"}>
                      {config.type === "flag" ? "feature flag" : config.type === "number" ? "limit" : "metin"}
                    </Badge>
                  </div>
                  <input name="description" type="hidden" value={config.description} />
                  <p className="mt-xs text-sm text-text-secondary">{config.description}</p>
                  {config.updatedAt ? (
                    <p className="mt-sm text-xs uppercase tracking-[0.16em] text-text-tertiary">Son güncelleme: {config.updatedAt}</p>
                  ) : null}
                </div>

                <div className="flex w-full flex-col gap-sm md:w-auto md:min-w-[240px]">
                  {config.type === "flag" ? (
                    <select
                      className="focus-ring min-h-11 rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                      defaultValue={String(config.value)}
                      name="value"
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Kapalı</option>
                    </select>
                  ) : (
                    <input
                      className="focus-ring min-h-11 rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                      defaultValue={String(config.value)}
                      name="value"
                      type={config.type === "number" ? "number" : "text"}
                    />
                  )}
                  <Button disabled={usingMockData} type="submit">
                    Kaydet
                  </Button>
                </div>
              </div>
            </form>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
