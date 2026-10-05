"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  ScanLine,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { NAVIGATION } from "@/constants/navigation";
import { ROLE_LABELS } from "@/constants/app";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { Brand } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";
import { cn, initials } from "@/utils/format";
import type { Role } from "@/types/user";

const icons = {
  dashboard: LayoutDashboard,
  patients: UsersRound,
  scan: ScanLine,
  history: History,
  users: ShieldCheck,
  records: ClipboardList,
  profile: UserRound,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="sidebar-inner">
      <Link href="/dashboard" onClick={onNavigate}>
        <Brand />
      </Link>
      <p className="nav-label">KHÔNG GIAN LÀM VIỆC</p>
      <nav aria-label="Điều hướng chính">
        {NAVIGATION.filter((item) => (item.roles as Role[]).includes(user.role)).map((item) => {
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
              <Icon size={19} />
              <span>{item.label}</span>
              {active && <span className="nav-active-dot" />}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note">
          <span className="note-icon">
            <ShieldCheck size={20} />
          </span>
          <strong>Chăm sóc từ sự thấu hiểu</strong>
          <p>Theo dõi sức khỏe phổi qua từng lần thăm khám.</p>
          <Link href="/history" onClick={onNavigate}>
            Xem lịch sử <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="sidebar-user">
          <span className="avatar">{initials(user.name)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{ROLE_LABELS[user.role]}</small>
          </div>
          <Button
            variant="ghost"
            aria-label="Đăng xuất"
            title="Đăng xuất"
            onClick={async () => {
              await authService.logout();
              router.replace("/login");
            }}
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
