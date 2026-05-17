import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getAdminIdentity } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const identity = await getAdminIdentity();

  return (
    <div className="min-h-screen px-lg py-lg">
      <a
        className="focus-ring sr-only absolute left-lg top-lg z-50 rounded-sm bg-surface-1 px-md py-sm text-sm text-text-primary focus:not-sr-only"
        href="#admin-main-content"
      >
        Ana içeriğe geç
      </a>
      <div className="mx-auto grid max-w-[1600px] gap-lg lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar role={identity.role} />

        <div className="min-w-0 space-y-lg">
          <Header email={identity.email} />
          <main className="min-w-0" id="admin-main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
