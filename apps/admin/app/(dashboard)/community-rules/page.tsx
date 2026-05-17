import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { getAdminCommunityRulesOrMock } from "@/lib/admin-data";
import { mockCommunityRulesConfig } from "@/lib/mock-data";
import { updateCommunityRules } from "./actions";

export default async function CommunityRulesPage({
  searchParams,
}: {
  searchParams?: { result?: string; message?: string };
}) {
  const { data: rules, usingMockData } = await getAdminCommunityRulesOrMock(mockCommunityRulesConfig);

  return (
    <PageShell
      eyebrow="Sprint 5 hazırlık"
      title="Topluluk kuralları"
      description="Kullanıcının uygulama içinde ve web’de göreceği TR-EN kural metnini buradan versiyonlayabilirsin."
    >
      {searchParams?.result === "updated" ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.message ?? "Topluluk kuralları kaydedildi."}
        </div>
      ) : null}

      {searchParams?.result === "error" ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-md text-sm leading-6 text-text-primary">
          {searchParams.message ?? "Topluluk kuralları kaydedilemedi."}
        </div>
      ) : null}

      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Canlı kural metni bulunamadı; panel v1.0 örnek metniyle çalışıyor."
        liveLabel="Topluluk kuralları canlı yapılandırmadan okunuyor."
      />

      <div className="grid gap-lg xl:grid-cols-[0.84fr_1.16fr]">
        <section className="surface-panel p-xl">
          <h2 className="text-lg font-semibold text-text-primary">Yayın özeti</h2>
          <div className="mt-lg space-y-md rounded-md border border-surface-3 bg-surface-2 p-lg">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Versiyon</p>
              <p className="mt-sm text-text-primary">{rules.version}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Yayın adresi</p>
              <p className="mt-sm text-text-primary">{rules.publishedUrl}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Son güncelleme</p>
              <p className="mt-sm text-text-primary">{rules.updatedAt}</p>
            </div>
          </div>

          <div className="mt-lg rounded-md border border-info/25 bg-info/10 p-md text-sm leading-6 text-text-primary">
            Uygulama store politikaları gereği kural metni kullanıcıya görünür, moderasyon aksiyonlarıyla uyumlu ve TR ile
            EN tarafında paralel tutulmalı.
          </div>
        </section>

        <section className="surface-panel p-xl">
          <form action={updateCommunityRules} className="space-y-lg">
            <div className="grid gap-md md:grid-cols-2">
              <label className="space-y-sm block">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Versiyon etiketi</span>
                <input
                  className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  defaultValue={rules.version}
                  name="version"
                  type="text"
                />
              </label>
              <label className="space-y-sm block">
                <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Yayın adresi</span>
                <input
                  className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                  defaultValue={rules.publishedUrl}
                  name="publishedUrl"
                  type="text"
                />
              </label>
            </div>

            <label className="space-y-sm block">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Türkçe kullanıcı metni</span>
              <textarea
                className="focus-ring min-h-[24rem] w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm leading-6 text-text-primary"
                defaultValue={rules.trText}
                name="trText"
              />
            </label>

            <label className="space-y-sm block">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">English user-facing text</span>
              <textarea
                className="focus-ring min-h-[20rem] w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm leading-6 text-text-primary"
                defaultValue={rules.enText}
                name="enText"
              />
            </label>

            <Button type="submit">Kural metnini kaydet</Button>
          </form>
        </section>
      </div>
    </PageShell>
  );
}
