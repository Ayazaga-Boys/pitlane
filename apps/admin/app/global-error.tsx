"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
          <div className="w-full rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_30px_80px_rgba(3,5,20,0.45)]">
            <p className="font-space text-xs uppercase tracking-[0.4em] text-[var(--text-secondary)]">
              Rollpit Admin
            </p>
            <h1 className="mt-4 font-display text-4xl text-[var(--text-primary)]">
              Beklenmeyen bir hata oluştu
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
              Hata kaydedildi. Yeniden denemek için aşağıdaki butonu
              kullanabilirsin.
            </p>
            <button
              className="mt-8 rounded-full border border-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(238,53,71,0.14)]"
              onClick={reset}
              type="button"
            >
              Tekrar dene
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
