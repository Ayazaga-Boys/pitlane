import type { AnalyticsPoint } from "@/lib/mock-data";

export function MiniBarChart({ data }: { data: AnalyticsPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-md">
      <div className="flex h-48 items-end gap-sm">
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-sm">
            <div
              aria-hidden="true"
              className="w-full rounded-t-sm bg-gradient-to-t from-pit-red-deep to-pit-red"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
            <span className="text-xs text-text-tertiary">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
