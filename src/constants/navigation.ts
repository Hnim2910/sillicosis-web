import type { Role } from "@/types/user";

export const NAVIGATION = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    icon: "dashboard",
    roles: ["patient", "doctor", "technician", "admin"],
  },
  {
    href: "/patients",
    label: "Hồ sơ bệnh nhân",
    icon: "patients",
    roles: ["doctor", "technician", "admin"],
  },
  {
    href: "/prediction",
    label: "Dự đoán mới",
    icon: "scan",
    roles: ["patient", "doctor", "technician"],
  },
  {
    href: "/history",
    label: "Lịch sử dự đoán",
    icon: "history",
    roles: ["patient", "doctor", "technician", "admin"],
  },
  { href: "/admin/users", label: "Quản lý tài khoản", icon: "users", roles: ["admin"] },
  { href: "/admin/records", label: "Quản lý bản ghi", icon: "records", roles: ["admin"] },
  {
    href: "/profile",
    label: "Hồ sơ cá nhân",
    icon: "profile",
    roles: ["patient", "doctor", "technician", "admin"],
  },
] satisfies { href: string; label: string; icon: string; roles: Role[] }[];

export function canAccessRoute(path: string, role: Role) {
  if (path === "/admin") return role === "admin";
  const entry = NAVIGATION.find((item) => path === item.href || path.startsWith(item.href + "/"));
  return !!entry && (entry.roles as Role[]).includes(role);
}
