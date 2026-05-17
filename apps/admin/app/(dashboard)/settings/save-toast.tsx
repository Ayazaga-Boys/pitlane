"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface SaveToastProps {
  result?: string;
  configKey?: string;
  message?: string;
}

export function SaveToast({ result, configKey, message }: SaveToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(Boolean(result));

  useEffect(() => {
    setMounted(true);
    setVisible(Boolean(result));
  }, [result]);

  useEffect(() => {
    if (!result) {
      return;
    }

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 2600);

    const cleanupTimer = window.setTimeout(() => {
      router.replace(pathname);
    }, 3200);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(cleanupTimer);
    };
  }, [pathname, result, router]);

  if (!result || !mounted) {
    return null;
  }

  const isSuccess = result === "updated";
  const title = isSuccess ? "Ayar aktif edildi" : "Kaydetme hatası";
  const description = isSuccess
    ? message || (configKey ? `${configKey} ayarı başarıyla kaydedildi.` : "Ayar başarıyla kaydedildi.")
    : message || "Ayar kaydedilirken beklenmeyen bir hata oluştu.";

  return (
    <div
      aria-live="polite"
      className={[
        "fixed right-6 top-24 z-[100] w-[min(420px,calc(100vw-32px))] transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
      ].join(" ")}
    >
      <div
        className={[
          "rounded-lg border px-lg py-md shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur",
          isSuccess ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10",
        ].join(" ")}
      >
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-xs text-sm leading-6 text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
