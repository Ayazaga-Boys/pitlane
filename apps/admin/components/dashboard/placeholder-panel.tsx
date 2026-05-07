import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/dashboard/page-shell";

interface PlaceholderPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
  ctaHref: string;
}

export function PlaceholderPanel({
  eyebrow,
  title,
  description,
  nextStep,
  ctaHref,
}: PlaceholderPanelProps) {
  return (
    <PageShell eyebrow={eyebrow} title={title} description={description}>
      <div className="surface-panel max-w-3xl p-xl">
        <p className="text-sm leading-6 text-text-secondary">{nextStep}</p>
        <div className="mt-lg">
          <Link
            className="focus-ring inline-flex min-h-11 items-center justify-center rounded-sm bg-surface-3 px-lg py-md text-sm font-semibold text-text-primary transition hover:bg-surface-2"
            href={ctaHref}
          >
            Dashboarda don
            <ArrowRight aria-hidden="true" className="ml-sm size-4" />
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
