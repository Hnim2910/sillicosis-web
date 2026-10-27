import { CircleAlert, ScanLine, ShieldCheck, TriangleAlert, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/types/user";
import type { VisitOutcome } from "@/types/visit";
import { Card } from "@/components/common/Card";

export function StatCards({
  role,
  patients,
  visits,
  counts,
}: {
  role: Role;
  patients: number;
  visits: number;
  counts: Record<VisitOutcome, number>;
}) {
  const items: {
    label: string;
    value: number;
    caption: string;
    icon: LucideIcon;
    color: string;
  }[] = [
    ...(role === "admin"
      ? [
          {
            label: "Hồ sơ bệnh nhân",
            value: patients,
            caption: "Tổng số hồ sơ trong hệ thống",
            icon: UsersRound,
            color: "",
          },
        ]
      : []),
    {
      label: "Lượt khám",
      value: visits,
      caption: role === "admin" ? "Của mọi bệnh nhân" : "Đã lưu vào lịch sử",
      icon: ScanLine,
      color: "blue",
    },
    {
      label: "Nghi bụi phổi silic",
      value: counts.Co,
      caption: "Theo kết quả AI gần nhất của mỗi lượt",
      icon: TriangleAlert,
      color: "amber",
    },
    ...(role === "admin"
      ? []
      : [
          {
            label: "Không phát hiện",
            value: counts.Khong,
            caption: "Theo kết quả AI gần nhất của mỗi lượt",
            icon: ShieldCheck,
            color: "",
          },
        ]),
    {
      label: "Lỗi / chưa dự đoán",
      value: counts.FAILED + counts.NONE,
      caption: "Cần chạy lại dự đoán",
      icon: CircleAlert,
      color: "purple",
    },
  ];
  return (
    <div className="stats-grid">
      {items.map((item) => (
        <Card key={item.label} className="stat-card">
          <div className="stat-top">
            <span>{item.label}</span>
            <span className={`stat-icon ${item.color}`}>
              <item.icon size={17} />
            </span>
          </div>
          <div className="stat-value">{item.value.toString().padStart(2, "0")}</div>
          <p className="stat-caption">{item.caption}</p>
        </Card>
      ))}
    </div>
  );
}
