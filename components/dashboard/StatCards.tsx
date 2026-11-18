import { CircleAlert, ScanLine, ShieldCheck, TriangleAlert, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/types/user";
import type { PredictionOutcome } from "@/types/prediction";
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
  counts: Record<PredictionOutcome, number>;
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
            label: "Bệnh nhân",
            value: patients,
            caption: "Tài khoản bệnh nhân",
            icon: UsersRound,
            color: "",
          },
        ]
      : []),
    {
      label: "Lượt chẩn đoán",
      value: visits,
      caption: role === "admin" ? "Của mọi bệnh nhân" : "Trong lịch sử",
      icon: ScanLine,
      color: "blue",
    },
    {
      label: "Nghi bụi phổi silic",
      value: counts.Co,
      caption: "Theo kết quả AI",
      icon: TriangleAlert,
      color: "amber",
    },
    ...(role === "admin"
      ? []
      : [
          {
            label: "Không phát hiện",
            value: counts.Khong,
            caption: "Theo kết quả AI",
            icon: ShieldCheck,
            color: "",
          },
        ]),
    {
      label: "Dự đoán lỗi",
      value: counts.FAILED,
      caption: "Cần thử lại",
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
