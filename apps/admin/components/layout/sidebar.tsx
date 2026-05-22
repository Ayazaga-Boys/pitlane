"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
import type { UserRole } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const visibleItems =
    role === "moderator"
      ? navigationItems.filter((item) => item.href === "/reports" || item.href === "/posts" || item.href === "/comments" || item.href === "/stories")
      : navigationItems;
  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <nav
        aria-label="Mobil admin navigasyonu"
        className="surface-panel flex gap-sm overflow-x-auto p-md lg:hidden"
      >
        {visibleItems.map((item) => {
          const active = isActiveLink(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              aria-current={active ? "page" : undefined}
              href={item.href}
              className={cn(
                "focus-ring inline-flex min-h-11 shrink-0 items-center gap-sm rounded-md border px-md py-sm text-sm font-medium transition",
                active
                  ? "border-pit-red bg-pit-red/10 text-text-primary"
                  : "border-surface-3 bg-surface-2 text-text-secondary hover:text-text-primary",
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <aside className="surface-panel sticky top-lg hidden h-[calc(100vh-2rem)] min-w-[280px] overflow-hidden p-lg lg:flex lg:flex-col">
        <div className="min-h-0 flex-1 space-y-xl overflow-y-auto pr-1">
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
            {visibleItems.map((item) => {
              const active = isActiveLink(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  aria-current={active ? "page" : undefined}
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

        <div className="mt-lg rounded-md border border-surface-3 bg-surface-2 p-md text-xs leading-5 text-text-secondary">
          {role === "moderator"
            ? "Moderatör görünümü şikayet, post, yorum ve story moderasyon akışlarını açar."
            : "Sadece admin rolü tam erişebilir. Service role anahtarı yalnızca server tarafında tutulur."}
        </div>
      </aside>
    </>
  );
}
