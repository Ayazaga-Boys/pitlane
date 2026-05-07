import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-pit-red text-text-on-brand hover:bg-pit-red-deep active:bg-pit-red-deep",
  secondary:
    "bg-surface-3 text-text-primary hover:bg-surface-2 active:bg-surface-2",
  ghost:
    "border border-pit-red bg-transparent text-pit-red hover:bg-pit-red/10 active:bg-pit-red/15",
  destructive:
    "bg-error text-white hover:opacity-90 active:opacity-80",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center rounded-sm px-lg py-md text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
