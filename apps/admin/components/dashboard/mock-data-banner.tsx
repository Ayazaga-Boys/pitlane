export function MockDataBanner({ label = "Mock veri aktif" }: { label?: string }) {
  return (
    <div className="rounded-md border border-warning/40 bg-warning/10 p-md text-sm leading-6 text-text-primary">
      {label}. Gerçek Supabase tabloları gelene kadar arayüz akışları örnek veriyle test ediliyor.
    </div>
  );
}
