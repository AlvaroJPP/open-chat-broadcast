import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

export function TouchButton({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cn(
        "touch-target inline-flex items-center justify-center gap-3 rounded-2xl font-display font-bold transition-all duration-150",
        "active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100",
        variant === "primary" &&
          "bg-primary text-primary-foreground shadow-kiosk hover:brightness-105",
        variant === "ghost" && "border border-border bg-secondary text-secondary-foreground",
        variant === "danger" && "border-border bg-destructive text-destructive-foreground",
        className,
      )}
    />
  );
}
