import type { Prediction, Visit } from "@/types/visit";
import { PREDICTION_ERRORS } from "@/constants/app";
import { NUMBER_RULES } from "@/utils/visitForm";

const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

/** 0.403 → "40,3%". */
export function formatPercent(value: number) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value * 100)}%`;
}

export function predictionErrorText(prediction: Prediction) {
  return (
    PREDICTION_ERRORS[prediction.errorCode || ""] ||
    "Không thể phân tích ảnh lúc này. Vui lòng thử lại sau."
  );
}

/** Label → value for every clinical value the visit has; unmeasured values are left out. */
export function clinicalRows(visit: Visit): [string, string][] {
  const rows: [string, string][] = [];
  const text = (label: string, value: string | null) => value && rows.push([label, value]);
  const number = (key: keyof typeof NUMBER_RULES) => {
    const value = visit[key];
    if (value !== null && value !== undefined)
      rows.push([
        NUMBER_RULES[key].label,
        `${numberFormat.format(value)} ${NUMBER_RULES[key].unit}`,
      ]);
  };
  text("Ngành nghề", visit.industry);
  text("Tỉnh/thành làm việc", visit.province);
  number("yearsInJob");
  number("yearsExposed");
  if (visit.ageAtVisit !== null) rows.push(["Tuổi khi khám", `${visit.ageAtVisit}`]);
  number("heightCm");
  number("weightKg");
  if (visit.bmi !== null) rows.push(["BMI (chỉ số khối cơ thể)", numberFormat.format(visit.bmi)]);
  number("systolicBp");
  number("diastolicBp");
  number("pulse");
  if (visit.smoker !== null) rows.push(["Hút thuốc", visit.smoker ? "Có" : "Không"]);
  number("cigarettesPerDay");
  number("fvcL");
  number("fev1L");
  return rows;
}
