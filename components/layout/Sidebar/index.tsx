"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ClipboardList,
  History,
  LayoutDashboard,
  ScanLine,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { NAVIGATION } from "@/constants/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/format";
import type { Role } from "@/types/user";
import { TieuSuReminder, showTieuSuReminder } from "./TieuSuReminder";

const icons = {
  dashboard: LayoutDashboard,
  scan: ScanLine,
  history: History,
  users: ShieldCheck,
  records: ClipboardList,
  profile: UserRound,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="sidebar-inner">
      <nav aria-label="Điều hướng chính">
        {NAVIGATION.filter(
          (item) =>
            !("hidden" in item && item.hidden) && (item.roles as Role[]).includes(user.role),
        ).map((item) => {
          const Icon = icons[item.icon as keyof typeof icons] || Activity;
          const active = path === item.href || path.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn("nav-link", active && "active")}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* Desktop sidebar only: the mobile menu closes when navigating, which would also close the form. */}
      {!onNavigate && showTieuSuReminder(user) && <TieuSuReminder user={user} />}
    </div>
  );
}
