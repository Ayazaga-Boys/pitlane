"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronRight, LogOut, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { mockCommunities, mockPins, mockReports, mockUsers } from "@/lib/mock-data";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  email?: string;
}

interface SearchSuggestion {
  id: string;
  label: string;
  href: string;
  category: "Sayfalar" | "Kullanıcılar" | "Topluluklar" | "Pinler" | "Şikayetler";
  description: string;
  keywords: string[];
}

const baseSuggestions: SearchSuggestion[] = [
  ...navigationItems.map((item) => ({
    id: `nav-${item.href}`,
    label: item.label,
    href: item.href,
    category: "Sayfalar" as const,
    description: item.description,
    keywords: [item.label, item.description, item.href],
  })),
  ...mockUsers.map((user) => ({
    id: `user-${user.id}`,
    label: user.displayName,
    href: `/users/${user.id}`,
    category: "Kullanıcılar" as const,
    description: `@${user.username} · ${user.city}`,
    keywords: [user.displayName, user.username, user.city, user.role],
  })),
  ...mockCommunities.map((community) => ({
    id: `community-${community.id}`,
    label: community.name,
    href: `/communities/${community.id}`,
    category: "Topluluklar" as const,
    description: `${community.city} · /${community.slug}`,
    keywords: [community.name, community.slug, community.city, community.vehicleType],
  })),
  ...mockPins.map((pin) => ({
    id: `pin-${pin.id}`,
    label: pin.name,
    href: `/pins/${pin.id}/verify`,
    category: "Pinler" as const,
    description: `${pin.owner} · ${pin.city}`,
    keywords: [pin.name, pin.owner, pin.city, pin.category],
  })),
  ...mockReports.map((report) => ({
    id: `report-${report.id}`,
    label: report.reason,
    href: "/reports",
    category: "Şikayetler" as const,
    description: `${report.reporter} · ${report.contentType}`,
    keywords: [report.reason, report.reporter, report.contentType, report.status],
  })),
];

function normalizeSearchValue(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function categoryTone(category: SearchSuggestion["category"]) {
  switch (category) {
    case "Kullanıcılar":
      return "text-sky-300";
    case "Topluluklar":
      return "text-emerald-300";
    case "Pinler":
      return "text-amber-300";
    case "Şikayetler":
      return "text-rose-300";
    default:
      return "text-text-tertiary";
  }
}

export function Header({ email }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(deferredQuery);

    if (!normalizedQuery) {
      return baseSuggestions.slice(0, 6);
    }

    return baseSuggestions
      .filter((item) => {
        const haystack = normalizeSearchValue([item.label, item.description, ...item.keywords].join(" "));
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 7);
  }, [deferredQuery]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function handleSuggestionSelect(href: string) {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (suggestions.length > 0) {
      handleSuggestionSelect(suggestions[0].href);
    }
  }

  return (
    <header className="surface-panel grid gap-lg p-lg xl:grid-cols-[minmax(0,1fr)_minmax(420px,560px)] xl:items-start">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-pit-red-soft">Sprint 1</p>
        <h2 className="mt-xs text-xl font-semibold text-text-primary md:text-2xl">Admin operasyon merkezi</h2>
        <p className="mt-sm max-w-2xl text-sm leading-6 text-text-secondary">
          Moderasyon, doğrulama ve operasyon kararlarını hızlı aksiyona döken tek panel.
        </p>
      </div>

      <div className="space-y-md">
        <div ref={containerRef} className="relative">
          <form className="surface-card p-sm" onSubmit={handleSearchSubmit}>
            <label className="relative block">
              <Search aria-hidden="true" className="pointer-events-none absolute left-md top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
              <span className="sr-only">Panel içi hızlı arama</span>
              <Input
                aria-expanded={isOpen}
                aria-label="Panel içinde ara"
                aria-controls="admin-search-suggestions"
                className="min-h-14 border-transparent bg-transparent pl-10 pr-md text-base"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Kullanıcı, topluluk, pin veya ekran ara"
                type="search"
                value={query}
              />
            </label>
          </form>

          {isOpen ? (
            <div
              className="surface-card absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden border-surface-3 bg-surface-1"
              id="admin-search-suggestions"
            >
              <div className="border-b border-surface-3 px-md py-sm text-xs uppercase tracking-[0.16em] text-text-tertiary">
                {query.trim() ? "Eşleşen sonuçlar" : "Hızlı geçişler"}
              </div>

              {suggestions.length > 0 ? (
                <div className="max-h-[320px] overflow-y-auto p-sm">
                  {suggestions.map((item) => {
                    const active = item.href === pathname;

                    return (
                      <button
                        key={item.id}
                        className={cn(
                          "focus-ring flex w-full items-start justify-between gap-md rounded-md px-md py-md text-left transition",
                          active
                            ? "bg-pit-red/10 text-text-primary"
                            : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
                        )}
                        onClick={() => handleSuggestionSelect(item.href)}
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className={cn("block text-[11px] font-semibold uppercase tracking-[0.16em]", categoryTone(item.category))}>
                            {item.category}
                          </span>
                          <span className="mt-1 block truncate text-sm font-semibold text-text-primary">{item.label}</span>
                          <span className="mt-1 block truncate text-xs text-text-tertiary">{item.description}</span>
                        </span>
                        <ChevronRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-text-tertiary" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-md py-lg text-sm text-text-secondary">Aramana uygun öneri bulunamadı. Daha genel bir kelime dene.</div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-sm">
          <button
            aria-label="Bildirimler"
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill border border-surface-3 bg-surface-2 text-text-secondary transition hover:text-text-primary"
            type="button"
          >
            <Bell aria-hidden="true" className="size-4" />
          </button>

          <div className="rounded-pill border border-surface-3 bg-surface-2 px-md py-sm text-sm text-text-secondary">
            {email ?? "admin@pitlane.app"}
          </div>

          <Button aria-label="Oturumu kapat" className="gap-sm" onClick={handleSignOut} variant="ghost">
            <LogOut aria-hidden="true" className="size-4" />
            Çıkış
          </Button>
        </div>
      </div>
    </header>
  );
}
