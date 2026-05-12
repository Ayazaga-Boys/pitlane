"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="surface-panel sticky top-lg hidden h-[calc(100vh-2rem)] min-w-[280px] flex-col justify-between p-lg lg:flex">
      <div className="space-y-xl">
        <div className="space-y-sm border-b border-surface-3 pb-lg">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-pit-red-soft">Rollpit Admin</p>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Kontrol Paneli</h1>
            <p className="mt-xs text-sm text-text-secondary">
              Moderasyon, analitik ve doğrulama akışlarının merkezi.
            </p>
          </div>
        </div>

        <nav aria-label="Admin navigasyonu" className="space-y-sm">
          {navigationItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "focus-ring flex min-h-11 items-start gap-md rounded-md border px-md py-md transition",
                  active
                    ? "border-pit-red bg-pit-red/10 text-text-primary shadow-elev-pin"
                    : "border-transparent bg-transparent text-text-secondary hover:border-surface-3 hover:bg-surface-2 hover:text-text-primary",
                )}
              >
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <span className="space-y-2xs">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs leading-5 text-text-tertiary">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-md border border-surface-3 bg-surface-2 p-md text-xs leading-5 text-text-secondary">
        Sadece admin rolü erişebilir. Service role anahtarı yalnızca server tarafında tutulur.
      </div>
    </aside>
  );
}
