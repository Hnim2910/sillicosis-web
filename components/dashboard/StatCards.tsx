import { ClipboardCheck, Clock3, ScanLine, UsersRound } from "lucide-react";
import { Card } from "@/components/common/Card";

export function StatCards({
  patients,
  predictions,
  reviewed,
  pending,
}: {
  patients: number;
  predictions: number;
  reviewed: number;
  pending: number;
}) {
  const items = [
    {
      label: "Hồ sơ bệnh nhân",
      value: patients,
      caption: "Hồ sơ trong phạm vi truy cập",
      icon: UsersRound,
      color: "",
    },
    {
      label: "Lượt phân tích",
      value: predictions,
      caption: "Đã lưu vào lịch sử",
      icon: ScanLine,
      color: "blue",
    },
    {
      label: "Đã đánh giá",
      value: reviewed,
      caption: "Đã được quản trị viên đánh giá",
      icon: ClipboardCheck,
      color: "purple",
    },
    {
      label: "Chờ đánh giá",
      value: pending,
      caption: "Chờ quản trị viên đánh giá",
      icon: Clock3,
      color: "amber",
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
