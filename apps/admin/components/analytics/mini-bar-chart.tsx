import type { AnalyticsPoint } from "@/lib/mock-data";

export function MiniBarChart({ data }: { data: AnalyticsPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const highest = data.reduce((best, item) => (item.value > best.value ? item : best), data[0] ?? { label: "-", value: 0 });
  const hasAnyData = total > 0;

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <span>Ölçek: 0 - {max}</span>
        <span>Toplam: {total}</span>
      </div>

      <div className="flex h-48 items-end gap-sm">
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-sm">
            <div className="text-xs font-medium text-text-secondary">{item.value}</div>
            <div className="flex h-40 w-full items-end rounded-sm border border-surface-3/60 bg-surface-2/40 px-1">
              <div
                aria-hidden="true"
                className="w-full rounded-t-sm bg-gradient-to-t from-pit-red-deep to-pit-red shadow-[0_10px_24px_rgba(255,74,90,0.18)] transition-[height] duration-300"
                style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%` }}
              />
            </div>
            <span className="text-xs text-text-tertiary">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-surface-3 bg-surface-2 px-md py-sm text-xs text-text-secondary">
        {hasAnyData
          ? `En yüksek dönem: ${highest.label} (${highest.value}). Sıfır görünen kolonlarda bu aralıkta kayıt yok.`
          : "Bu grafikte henüz veri yok. Sıfır görünen tüm kolonlar seçilen aralıkta kayıt olmadığını gösterir."}
      </div>
    </div>
  );
}
