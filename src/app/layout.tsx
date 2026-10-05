import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SilicoCare · Hỗ trợ sàng lọc bụi phổi silic", template: "%s | SilicoCare" },
  description:
    "Frontend prototype hỗ trợ quản lý hồ sơ, ảnh X-quang và lịch sử sàng lọc Silicosis.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
