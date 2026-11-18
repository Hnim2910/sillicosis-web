import type { Prediction } from "@/types/prediction";
import {
  CLINICAL_HIGH_RISK,
  CLINICAL_RISK_TEXT,
  PREDICTION_ERRORS,
  RECOMMENDATION_TEXT,
} from "@/constants/app";
import type { ClinicalRiskLevel } from "@/constants/app";
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

/** Headline score: the fused score with an image. Clinical-only results show a risk level instead
 *  (clinicalRiskLevel). */
export function mainChance(prediction: Prediction): number | null {
  if (prediction.status !== "SUCCESS" || !prediction.coAnh) return null;
  return prediction.pGhep;
}

/** Recommendation from the model's own conclusion (ket_luan_cuoi), worded by whether an image was used. */
export function recommendationText(prediction: Prediction) {
  const level = clinicalRiskLevel(prediction);
  if (level) return CLINICAL_RISK_TEXT[level].advice;
  return prediction.ketLuanCuoi ? RECOMMENDATION_TEXT.imageAtRisk : RECOMMENDATION_TEXT.low;
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

/** Short result for tables: the score with an image, the risk level without one. */
export function shortResult(prediction: Prediction) {
  const chance = mainChance(prediction);
  if (chance !== null) return `Khả năng ${formatChance(chance)}`;
  const level = clinicalRiskLevel(prediction);
  return level ? CLINICAL_RISK_TEXT[level].label : "—";
}

export function predictionErrorText(prediction: Prediction) {
  return (
    PREDICTION_ERRORS[prediction.errorCode || ""] ||
    "Không thể phân tích lúc này. Vui lòng thử lại sau."
  );
}

/** Label → value for every clinical value sent with the screening, in form order. */
export function clinicalRows(prediction: Prediction): [string, string][] {
  const values = prediction.lamSang ?? {};
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
