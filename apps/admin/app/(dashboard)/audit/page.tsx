import { AuditTable } from "@/components/audit/audit-table";
import { DataStateBanner } from "@/components/dashboard/data-state-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminAuditLogsOrMock } from "@/lib/admin-data";
import { mockAuditEntries } from "@/lib/mock-data";

function normalizeValue(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: { q?: string; action?: string; target?: string };
}) {
  const { data: entries, usingMockData } = await getAdminAuditLogsOrMock(mockAuditEntries);
  const query = searchParams?.q?.trim() ?? "";
  const action = searchParams?.action?.trim() ?? "";
  const target = searchParams?.target?.trim() ?? "";

  const filteredEntries = entries.filter((entry) => {
    const matchesQuery =
      !query ||
      normalizeValue([entry.actorLabel, entry.summary, entry.targetId, entry.targetType].join(" ")).includes(normalizeValue(query));
    const matchesAction = !action || entry.action === action;
    const matchesTarget = !target || entry.targetType === target;

    return matchesQuery && matchesAction && matchesTarget;
  });

  return (
    <PageShell
      eyebrow="Sprint 4 hazırlık"
      title="Audit Log"
      description="Admin ve moderasyon aksiyon geçmişi burada filtrelenebilir şekilde görünür."
    >
      <DataStateBanner
        usingMockData={usingMockData}
        mockLabel="Gerçek audit log kayıtları okunamadı; test için örnek aksiyon geçmişi gösteriliyor."
        liveLabel="Audit log kayıtları gerçek Supabase verisinden okunuyor."
      />

      <div className="surface-panel p-xl">
        <form className="flex flex-col gap-md xl:flex-row xl:items-end xl:justify-between" method="get">
          <div className="grid flex-1 gap-md md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Arama</span>
              <Input defaultValue={query} name="q" placeholder="yönetici, hedef ya da özet ara" />
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Aksiyon</span>
              <select
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue={action}
                name="action"
              >
                <option value="">Tüm aksiyonlar</option>
                <option value="user_banned">Kullanıcı banlandı</option>
                <option value="user_unbanned">Ban kaldırıldı</option>
                <option value="content_deleted">İçerik silindi</option>
                <option value="content_restored">İçerik geri yüklendi</option>
                <option value="pin_verified">Pin doğrulandı</option>
                <option value="pin_rejected">Pin reddedildi</option>
                <option value="config_changed">Yapılandırma</option>
                <option value="report_resolved">Şikayet çözüldü</option>
              </select>
            </label>
            <label className="space-y-sm">
              <span className="text-xs uppercase tracking-[0.16em] text-text-tertiary">Hedef tipi</span>
              <select
                className="focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary"
                defaultValue={target}
                name="target"
              >
                <option value="">Tüm hedefler</option>
                <option value="profile">Profil</option>
                <option value="business_pin">Business pin</option>
                <option value="business_application">İşletme başvurusu</option>
                <option value="community">Topluluk</option>
                <option value="community_event">Topluluk etkinliği</option>
                <option value="competition">Yarışma</option>
                <option value="competition_entry">Yarışma katılımı</option>
                <option value="feed_override">Feed override</option>
                <option value="support_note">Destek notu</option>
                <option value="report">Şikayet</option>
                <option value="message">Mesaj</option>
              </select>
            </label>
          </div>

          <div className="flex gap-sm">
            <Button type="submit">Filtrele</Button>
            <a
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary"
              href="/audit"
            >
              Temizle
            </a>
          </div>
        </form>

        <div className="mt-lg">
          <AuditTable entries={filteredEntries} />
        </div>
      </div>
    </PageShell>
  );
}
