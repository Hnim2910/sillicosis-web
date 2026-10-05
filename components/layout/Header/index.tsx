"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, ShieldCheck } from "lucide-react";
import { NAVIGATION } from "@/constants/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/utils/format";
import { Button } from "@/components/common/Button";

export function Header({ onMenu }: { onMenu: () => void }) {
  const path = usePathname();
  const { user } = useAuth();
  const title =
    NAVIGATION.find((item) => path === item.href || path.startsWith(item.href + "/"))?.label ||
    "Không gian làm việc";
  return (
    <header className="app-header">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          className="mobile-menu-button"
          variant="ghost"
          aria-label="Mở menu"
          onClick={onMenu}
        >
          <Menu size={21} />
        </Button>
        <div className="breadcrumbs">
          <span>Không gian làm việc</span>
          <ChevronRight size={14} />
          <strong>{title}</strong>
        </div>
      </div>
      <div className="header-actions">
        <span className="demo-tag">
          <span />
          Bản demo
        </span>
        <ShieldCheck size={19} className="header-shield" />
        <Link href="/profile" aria-label="Mở hồ sơ cá nhân" className="avatar avatar-small">
          {initials(user?.name || "SC")}
        </Link>
      </div>
    </header>
  );
}
