import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { MockDataBanner } from "@/components/dashboard/mock-data-banner";
import { PageShell } from "@/components/dashboard/page-shell";
import { UserDetailGrid } from "@/components/users/user-detail-grid";
import { UserSummaryCard } from "@/components/users/user-summary-card";
import { getMockUserById } from "@/lib/mock-data";

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const user = getMockUserById(params.id);

  if (!user) {
    notFound();
  }

  return (
    <PageShell
      eyebrow="Sprint 2 hazırlık"
      title="Kullanıcı detayı"
      description="Gerçek `profiles` ve ilişkili tablolar gelene kadar bu ekran mock veriyle moderasyon akışını prova eder."
    >
      <Link
        className="focus-ring inline-flex items-center gap-sm rounded-sm text-sm font-medium text-text-secondary hover:text-text-primary"
        href="/users"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Kullanıcı listesine dön
      </Link>

      <MockDataBanner label="Detay ekranı şu an örnek kullanıcı verisiyle besleniyor" />
      <UserSummaryCard user={user} />
      <UserDetailGrid user={user} />
    </PageShell>
  );
}
