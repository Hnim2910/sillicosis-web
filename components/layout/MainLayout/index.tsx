"use client";
import { Fragment, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Modal } from "@/components/common/Modal";
import { ToastProvider } from "@/components/common/Toast";
import { Loading } from "@/components/common/Loading";
import { ErrorState } from "@/components/common/Feedback";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoute } from "@/constants/navigation";

/** Header across the full width; the sidebar sits under it on the left. */
export function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading, error, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!loading && !user && !error) router.replace("/login");
  }, [loading, user, error, router]);
  if (error) return <ErrorState message={error} retry={refresh} />;
  if (loading || !user) return <Loading />;
  return (
    <ToastProvider>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Chuyển tới nội dung
        </a>
        <Header onMenu={() => setMenuOpen(true)} />
        <aside className="desktop-sidebar">
          <Sidebar />
        </aside>
        <div className="workspace">
          <main id="main-content" className="main-content">
            {canAccessRoute(pathname, user.role) ? (
              <Fragment key={`${user.id}:${user.role}`}>{children}</Fragment>
            ) : (
              <div className="empty-state">
                <h1>Bạn không có quyền truy cập</h1>
                <p>Màn hình này không dành cho vai trò của bạn.</p>
                <Link href="/dashboard" className="btn btn-primary">
                  Về tổng quan
                </Link>
              </div>
            )}
          </main>
        </div>
        <Modal open={menuOpen} title="Điều hướng" onClose={() => setMenuOpen(false)}>
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </Modal>
      </div>
    </ToastProvider>
  );
}
