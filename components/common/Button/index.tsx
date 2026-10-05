import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/utils/format";

export function Button({
  children,
  className,
  variant = "primary",
  busy,
  disabled,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      type={type}
      className={cn("btn", `btn-${variant}`, className)}
      disabled={disabled || busy}
      aria-busy={busy}
      {...props}
    >
      {busy && <LoaderCircle size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
