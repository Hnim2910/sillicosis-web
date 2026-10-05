import type { ReactNode } from "react";
import { cn } from "@/utils/format";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "blue";
}) {
  return (
    <span className={cn("badge", `badge-${tone}`)}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
