import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getAdminIdentity } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const identity = await getAdminIdentity();

  return (
    <div className="min-h-screen px-lg py-lg">
      <div className="mx-auto grid max-w-[1600px] gap-lg lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />

        <div className="space-y-lg">
          <Header email={identity.email} />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
