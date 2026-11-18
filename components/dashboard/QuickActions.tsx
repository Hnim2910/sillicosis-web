import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  History,
  ScanLine,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { Role } from "@/types/user";
import { Card, CardHeader } from "@/components/common/Card";

export function QuickActions({ role }: { role: Role }) {
  const actions =
    role === "admin"
      ? [
          {
            href: "/admin/users",
            title: "Quản lý tài khoản",
            detail: "Tạo, khoá hoặc xoá tài khoản bệnh nhân",
            icon: ShieldCheck,
          },
          {
            href: "/admin/records",
            title: "Quản lý bản ghi",
            detail: "Tra cứu và xoá lượt chẩn đoán",
            icon: ClipboardList,
          },
        ]
      : [
          {
            href: "/prediction",
            title: "Dự đoán mới",
            detail: "Gửi thông tin lâm sàng và/hoặc ảnh X-quang",
            icon: ScanLine,
          },
          {
            href: "/profile",
            title: "Hồ sơ của tôi",
            detail: "Cập nhật thông tin cá nhân",
            icon: UserRound,
          },
        ];
  return (
    <Card>
      <CardHeader title="Truy cập nhanh" />
      <div className="quick-list">
        {[
          ...actions,
          {
            href: "/history",
            title: "Tra cứu lịch sử",
            detail: "Xem lại kết quả đã thực hiện",
            icon: History,
          },
        ].map((action) => (
          <Link href={action.href} key={action.href} className="quick-link">
            <span className="stat-icon">
              <action.icon size={18} />
            </span>
            <div>
              <strong>{action.title}</strong>
              <p>{action.detail}</p>
            </div>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </div>
    </Card>
  );
}
