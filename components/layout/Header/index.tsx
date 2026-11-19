"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, KeyRound, LogOut, Menu, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { ROLE_LABELS } from "@/constants/app";
import { cn, initials } from "@/utils/format";
import { Brand } from "@/components/common/Brand";
import { Button } from "@/components/common/Button";

/** Avatar, name and role; opens the account menu (profile, change password, sign out). */
function AccountMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  if (!user) return null;
  return (
    <div ref={root} className={cn("account-menu", open && "is-open")}>
      <button
        type="button"
        className="account-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="avatar">{initials(user.name)}</span>
        <span className="header-account__text">
          <strong>{user.name}</strong>
          <small>{ROLE_LABELS[user.role]}</small>
        </span>
        <ChevronDown size={16} className="account-menu__caret" aria-hidden="true" />
      </button>
      {open && (
        <div className="account-menu__list" role="menu">
          <Link
            href="/profile"
            role="menuitem"
            className="account-menu__item"
            onClick={() => setOpen(false)}
          >
            <UserRound size={17} />
            Hồ sơ cá nhân
          </Link>
          <Link
            href="/change-password"
            role="menuitem"
            className="account-menu__item"
            onClick={() => setOpen(false)}
          >
            <KeyRound size={17} />
            Đổi mật khẩu
          </Link>
          <button
            type="button"
            role="menuitem"
            className="account-menu__item is-danger"
            onClick={async () => {
              setOpen(false);
              await authService.logout();
              router.replace("/login");
            }}
          >
            <LogOut size={17} />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

/** Full-width top bar: logo on the left, the account menu on the right. */
export function Header({ onMenu }: { onMenu: () => void }) {
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
        <Link href="/dashboard" aria-label="SilicoCare – về trang tổng quan">
          <Brand />
        </Link>
      </div>
      <AccountMenu />
    </header>
  );
}
