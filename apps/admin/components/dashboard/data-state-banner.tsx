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
    <div className="rounded-md border border-warning/40 bg-warning/10 p-md text-sm leading-6 text-text-primary">
      {mockLabel}
    </div>
  ) : (
    <div className="rounded-md border border-success/30 bg-success/10 p-md text-sm leading-6 text-text-primary">
      {liveLabel}
    </div>
  );
}
