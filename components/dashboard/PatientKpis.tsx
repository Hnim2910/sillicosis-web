import { Activity, ArrowDown, ArrowUp, ScanLine, ShieldCheck, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Prediction } from "@/types/prediction";
import { predictionOutcome } from "@/services/predictionService";
import { formatDate } from "@/utils/format";
import { formatChance } from "@/utils/predictionDisplay";

const DAY = 24 * 60 * 60 * 1000;

interface Kpi {
  label: string;
  value: string;
  unit?: string;
  /** 10px line right under the value. */
  detail?: string;
  caption: ReactNode;
  icon: LucideIcon;
  tone: "teal" | "blue" | "amber" | "green";
}

const percentOf = (count: number, total: number) =>
  total ? `${Math.round((count / total) * 100)}%` : "0%";

/** The four numbers of the patient dashboard, as a 2 × 2 block. `predictions` is newest first. */
export function PatientKpis({ predictions, now }: { predictions: Prediction[]; now: number }) {
  const total = predictions.length;
  const recent = predictions.filter(
    (item) => now - new Date(item.createdAt).getTime() <= 30 * DAY,
  ).length;
  const atRisk = predictions.filter((item) => predictionOutcome(item) === "Co").length;
  const low = predictions.filter((item) => predictionOutcome(item) === "Khong").length;
  const withImage = predictions.filter(
    (item) => item.status === "SUCCESS" && item.coAnh && item.pGhep !== null,
  );
  const [latest, previous] = withImage;

  // No earlier screening with an X-ray to compare with: a neutral placeholder.
  let trend: ReactNode = (
    <span className="kpi-trend">
      <ArrowUp size={15} strokeWidth={2.5} className="kpi-trend__none" aria-hidden="true" />
      <strong>__%</strong>
      <span>so với kì trước</span>
    </span>
  );
  if (latest && previous) {
    const points = Math.round(((latest.pGhep ?? 0) - (previous.pGhep ?? 0)) * 100);
    const Icon = points >= 0 ? ArrowUp : ArrowDown;
    trend = (
      <span className={`kpi-trend ${points > 0 ? "up" : points < 0 ? "down" : ""}`}>
        <Icon size={15} strokeWidth={2.5} aria-label={points >= 0 ? "Tăng" : "Giảm"} />
        <strong>{Math.abs(points)}%</strong>
        <span>so với lần khám trước đó</span>
      </span>
    );
  }

  const items: Kpi[] = [
    {
      label: "Lượt chẩn đoán",
      value: String(total),
      unit: "lượt",
      caption: recent ? (
        <span className="kpi-trend new">
          <ArrowUp size={15} strokeWidth={2.5} aria-label="Thêm" />
          <strong>{recent}</strong>
          <span>trong 30 ngày qua</span>
        </span>
      ) : (
        "Không có lượt mới trong 30 ngày qua"
      ),
      icon: ScanLine,
      tone: "teal",
    },
    {
      label: "Nguy cơ gần nhất",
      value: latest ? formatChance(latest.pGhep ?? 0) : "—",
      detail: latest ? `Ngày khám ${formatDate(latest.examDate)}` : undefined,
      caption: trend,
      icon: Activity,
      tone: "blue",
    },
    {
      label: "Có nguy cơ",
      value: String(atRisk),
      unit: "lượt",
      caption: (
        <>
          <strong className="kpi-number">{percentOf(atRisk, total)}</strong> số lượt chẩn đoán
        </>
      ),
      icon: TriangleAlert,
      tone: "amber",
    },
    {
      label: "Nguy cơ thấp",
      value: String(low),
      unit: "lượt",
      caption: (
        <>
          <strong className="kpi-number">{percentOf(low, total)}</strong> số lượt chẩn đoán
        </>
      ),
      icon: ShieldCheck,
      tone: "green",
    },
  ];

  return (
    <div className="kpi-grid">
      {items.map((item) => (
        <div key={item.label} className={`kpi-card kpi-${item.tone}`}>
          <div className="kpi-top">
            <span className="kpi-label">{item.label}</span>
            <span className="kpi-icon">
              <item.icon size={18} />
            </span>
          </div>
          <p className="kpi-value">
            {item.value}
            {item.unit && <small>{item.unit}</small>}
          </p>
          {item.detail && (
            <p>
              <span className="kpi-detail">{item.detail}</span>
            </p>
          )}
          <p className="kpi-caption">{item.caption}</p>
          <span className="kpi-decor" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
