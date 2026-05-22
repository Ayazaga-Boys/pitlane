import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { SupportSearchResults } from "@/components/users/support-search-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminSupportSearchOrMock } from "@/lib/admin-data";
import { mockUsers } from "@/lib/mock-data";

export default async function SupportSearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const query = searchParams?.q?.trim() ?? "";
  const { data: users, usingMockData } = await getAdminSupportSearchOrMock(query, mockUsers);

  return (
    <PageShell
      eyebrow="Sprint 6 hazırlık"
      title="Destek arama"
      description="Destek ekibi burada kullanıcıyı e-posta, kullanıcı adı veya telefon üzerinden bulup detay ekranına geçer."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Canlı auth araması okunamadı; ekran örnek kullanıcı verisiyle çalışıyor."
        liveLabel="Destek araması gerçek auth ve profile verisiyle yapılıyor."
      />

      <section className="surface-panel p-xl">
        <form className="flex flex-col gap-md xl:flex-row xl:items-end xl:justify-between" method="get">
          <div className="grid flex-1 gap-md xl:grid-cols-[minmax(0,1fr)_220px]">
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
              <Input
                defaultValue={query}
                name="q"
                placeholder="E-posta, kullanıcı adı veya telefon ara"
              />
            </label>
            <div className="rounded-md border border-info/25 bg-info/10 p-md text-sm leading-6 text-text-primary">
              En az birkaç harf yazman sonuçları daha temiz daraltır.
            </div>
          </div>

          <div className="flex gap-sm">
            <Button type="submit">Ara</Button>
            <a className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary" href="/support-search">
              Temizle
            </a>
          </div>
        </form>

        <div className="mt-lg">
          <SupportSearchResults users={users} />
        </div>
      </section>
    </PageShell>
  );
}
