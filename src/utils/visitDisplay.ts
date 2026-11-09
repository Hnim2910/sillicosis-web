import type { Prediction, Visit } from "@/types/visit";
import {
  CLINICAL_HIGH_RISK,
  CLINICAL_RISK_TEXT,
  PREDICTION_ERRORS,
  RECOMMENDATION_TEXT,
} from "@/constants/app";
import type { ClinicalRiskLevel } from "@/constants/app";
import { NUMBER_RULES } from "@/utils/visitForm";
import { CLINICAL_FIELDS } from "@/constants/clinicalFields";

const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

/** 0.403 → "40,3%". */
export function formatPercent(value: number) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value * 100)}%`;
}

/** Whole percent for the main number: 0.163 → "16%", below 1% → "<1%". */
export function formatChance(value: number) {
  const percent = value * 100;
  return percent < 1 ? "<1%" : `${Math.round(percent)}%`;
}

/** Headline score: the fused score with an image (old results: their probability).
 *  Clinical-only results show a risk level instead (clinicalRiskLevel). */
export function mainChance(prediction: Prediction): number | null {
  if (prediction.status !== "SUCCESS" || prediction.coAnh === false) return null;
  if (prediction.coAnh && prediction.pGhep !== null) return prediction.pGhep;
  return prediction.probability;
}

/** Recommendation from the model's own conclusion (ket_luan_cuoi), worded by whether an image was used. */
export function recommendationText(prediction: Prediction) {
  const level = clinicalRiskLevel(prediction);
  if (level) return CLINICAL_RISK_TEXT[level].advice;
  const atRisk = prediction.ketLuanCuoi ?? prediction.label === "Co";
  return atRisk ? RECOMMENDATION_TEXT.imageAtRisk : RECOMMENDATION_TEXT.low;
}

/** Clinical-only result → low (< nguong_lam_sang), medium (< CLINICAL_HIGH_RISK) or high; null otherwise. */
export function clinicalRiskLevel(prediction: Prediction): ClinicalRiskLevel | null {
  if (prediction.status !== "SUCCESS" || prediction.coAnh !== false) return null;
  const p = prediction.pLamSang;
  if (p === null || p === undefined) return null;
  if (p >= CLINICAL_HIGH_RISK) return "high";
  const belowThreshold =
    prediction.nguongLamSang !== null && prediction.nguongLamSang !== undefined
      ? p < prediction.nguongLamSang
      : prediction.baoNguyCoLamSang === false;
  return belowThreshold ? "low" : "medium";
}

export function predictionErrorText(prediction: Prediction) {
  return (
    PREDICTION_ERRORS[prediction.errorCode || ""] ||
    "Không thể phân tích lúc này. Vui lòng thử lại sau."
  );
}

export function hasLamSang(visit: Visit) {
  return Object.keys(visit.extra?.lam_sang ?? {}).length > 0;
}

/** New Way values (extra.lam_sang) with their Vietnamese labels, in form order. */
function lamSangRows(visit: Visit): [string, string][] {
  const values = visit.extra?.lam_sang ?? {};
  const rows: [string, string][] = [];
  for (const field of CLINICAL_FIELDS) {
    const value = values[field.key];
    if (value === undefined || value === null || value === "") continue;
    const shown =
      field.kind === "muc"
        ? (field.options?.find((option) => option.code === String(value))?.label ?? String(value))
        : field.kind === "so" && typeof value === "number"
          ? numberFormat.format(value)
          : String(value);
    rows.push([field.label, field.unit ? `${shown} ${field.unit}` : shown]);
  }
  return rows;
}

/** Label → value for every clinical value the visit has; unmeasured values are left out.
 *  New Way visits show extra.lam_sang; the old columns are still shown for older visits. */
export function clinicalRows(visit: Visit): [string, string][] {
  const rows: [string, string][] = lamSangRows(visit);
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
