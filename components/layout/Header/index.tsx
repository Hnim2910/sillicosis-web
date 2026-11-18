"use client";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/utils/format";
import { Brand } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";

/** Full-width top bar: logo on the left, the account avatar on the right. */
export function Header({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth();
  return (
    <header className="app-header">
      <div className="flex min-w-0 items-center gap-3">
        <Button className="mobile-menu-button" variant="ghost" aria-label="Mở menu" onClick={onMenu}>
          <Menu size={21} />
        </Button>
        <Link href="/dashboard" aria-label="SilicoCare – về trang tổng quan">
          <Brand />
        </Link>
      </div>
      <Link
        href="/profile"
        aria-label="Mở hồ sơ cá nhân"
        title={user?.name}
        className="avatar avatar-small"
      >
        {initials(user?.name || "SC")}
      </Link>
    </header>
  );
}
