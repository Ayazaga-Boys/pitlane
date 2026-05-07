"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  email?: string;
}

export function Header({ email }: HeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="surface-panel flex flex-col gap-md p-lg md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-pit-red-soft">Sprint 1</p>
        <h2 className="mt-xs text-xl font-semibold text-text-primary">Admin operasyon merkezi</h2>
      </div>

      <div className="flex flex-col gap-md md:flex-row md:items-center">
        <label className="relative block min-w-[280px]">
          <Search aria-hidden="true" className="pointer-events-none absolute left-md top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <span className="sr-only">Panel ici arama</span>
          <Input className="pl-10" placeholder="Kullanici, pin veya sikayet ara" type="search" />
        </label>

        <div className="flex items-center gap-sm">
          <button
            aria-label="Bildirimler"
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill border border-surface-3 bg-surface-2 text-text-secondary transition hover:text-text-primary"
            type="button"
          >
            <Bell aria-hidden="true" className="size-4" />
          </button>

          <div className="hidden rounded-pill border border-surface-3 bg-surface-2 px-md py-sm text-sm text-text-secondary sm:block">
            {email ?? "admin@pitlane.app"}
          </div>

          <Button className="gap-sm" onClick={handleSignOut} variant="ghost">
            <LogOut aria-hidden="true" className="size-4" />
            Cikis
          </Button>
        </div>
      </div>
    </header>
  );
}
