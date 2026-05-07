import type { ReactNode } from "react";

interface PageShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <section className="space-y-xl">
      <div className="space-y-sm">
        {eyebrow ? (
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-pit-red-soft">{eyebrow}</p>
        ) : null}
        <div className="space-y-xs">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-text-secondary">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
