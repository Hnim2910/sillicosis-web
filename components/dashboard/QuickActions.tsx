import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  History,
  ScanLine,
  ShieldCheck,
  UserRound,
  UsersRound,
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
            detail: "Tạo tài khoản và phân quyền",
            icon: ShieldCheck,
          },
          {
            href: "/admin/records",
            title: "Quản lý bản ghi",
            detail: "Ghi chú và đánh giá mô hình",
            icon: ClipboardList,
          },
        ]
      : [
          {
            href: "/prediction",
            title: "Phân tích ảnh X-quang",
            detail: "Bắt đầu một lần sàng lọc mới",
            icon: ScanLine,
          },
          {
            href: role === "patient" ? "/profile" : "/patients",
            title: role === "patient" ? "Hồ sơ của tôi" : "Hồ sơ bệnh nhân",
            detail: "Cập nhật thông tin và dữ liệu theo dõi",
            icon: role === "patient" ? UserRound : UsersRound,
          },
        ];
  return (
    <Card>
      <CardHeader title="Truy cập nhanh" description="Các công việc thường dùng" />
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
