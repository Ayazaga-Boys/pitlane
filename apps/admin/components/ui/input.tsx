import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring min-h-12 w-full rounded-sm border border-surface-3 bg-surface-1 px-md py-md text-sm text-text-primary placeholder:text-text-tertiary",
        className,
      )}
      {...props}
    />
  );
}
