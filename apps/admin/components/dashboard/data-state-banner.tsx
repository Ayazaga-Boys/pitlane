export function DataStateBanner({
  usingMockData,
  mockLabel,
  liveLabel,
}: {
  usingMockData: boolean;
  mockLabel: string;
  liveLabel: string;
}) {
  return usingMockData ? (
    <div
      aria-live="polite"
      className="rounded-md border border-warning/40 bg-warning/10 p-md text-sm leading-6 text-text-primary"
      role="status"
    >
      {mockLabel}
    </div>
  ) : (
    <div
      aria-live="polite"
      className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary"
      role="status"
    >
      {liveLabel}
    </div>
  );
}
