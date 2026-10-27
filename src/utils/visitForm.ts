import type { VisitClinical } from "@/types/visit";
import { today } from "@/utils/format";

// Form state for one visit's clinical values. Inputs are strings; empty means "not measured".

type NumberKey = Exclude<keyof VisitClinical, "visitDate" | "industry" | "province" | "smoker">;

export type VisitDraft = { [K in keyof VisitClinical]: string };

interface NumberRule {
  label: string;
  unit: string;
  min: number;
  max: number;
  integer?: boolean;
  step: string;
}

/** Same ranges as the backend's VisitRequest. */
export const NUMBER_RULES: Record<NumberKey, NumberRule> = {
  yearsInJob: { label: "Tuổi nghề", unit: "năm", min: 0, max: 60, step: "0.5" },
  yearsExposed: { label: "Số năm phơi nhiễm bụi", unit: "năm", min: 0, max: 60, step: "0.5" },
  heightCm: { label: "Chiều cao", unit: "cm", min: 100, max: 220, step: "0.1" },
  weightKg: { label: "Cân nặng", unit: "kg", min: 20, max: 200, step: "0.1" },
  systolicBp: {
    label: "Huyết áp tâm thu",
    unit: "mmHg",
    min: 60,
    max: 260,
    integer: true,
    step: "1",
  },
  diastolicBp: {
    label: "Huyết áp tâm trương",
    unit: "mmHg",
    min: 30,
    max: 160,
    integer: true,
    step: "1",
  },
  pulse: { label: "Mạch", unit: "lần/phút", min: 30, max: 220, integer: true, step: "1" },
  cigarettesPerDay: { label: "Số điếu thuốc mỗi ngày", unit: "điếu", min: 0, max: 100, step: "1" },
  fvcL: { label: "FVC (dung tích sống gắng sức)", unit: "lít", min: 0.3, max: 8, step: "0.01" },
  fev1L: {
    label: "FEV1 (thể tích thở ra gắng sức giây đầu)",
    unit: "lít",
    min: 0.2,
    max: 8,
    step: "0.01",
  },
};

export function emptyVisitDraft(): VisitDraft {
  return {
    visitDate: today(),
    industry: "",
    yearsInJob: "",
    province: "",
    yearsExposed: "",
    heightCm: "",
    weightKg: "",
    systolicBp: "",
    diastolicBp: "",
    pulse: "",
    smoker: "",
    cigarettesPerDay: "",
    fvcL: "",
    fev1L: "",
  };
}

function parseNumber(value: string) {
  const text = value.trim().replace(",", ".");
  return text ? Number(text) : null;
}

/** Field → message for every invalid field; empty when the draft can be sent. */
export function validateVisitDraft(
  draft: VisitDraft,
): Partial<Record<keyof VisitClinical, string>> {
  const errors: Partial<Record<keyof VisitClinical, string>> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.visitDate) || draft.visitDate > today())
    errors.visitDate = "Ngày khám không hợp lệ hoặc ở tương lai.";
  if (draft.industry.trim().length > 100) errors.industry = "Ngành nghề tối đa 100 ký tự.";
  if (draft.province.trim().length > 50) errors.province = "Tỉnh/thành tối đa 50 ký tự.";
  for (const [key, rule] of Object.entries(NUMBER_RULES) as [NumberKey, NumberRule][]) {
    const value = parseNumber(draft[key]);
    if (value === null) continue;
    if (
      !Number.isFinite(value) ||
      value < rule.min ||
      value > rule.max ||
      (rule.integer && !Number.isInteger(value))
    )
      errors[key] =
        `${rule.label} từ ${rule.min} đến ${rule.max} ${rule.unit}${rule.integer ? " (số nguyên)" : ""}.`;
  }
  const systolic = parseNumber(draft.systolicBp);
  const diastolic = parseNumber(draft.diastolicBp);
  if (!errors.systolicBp && systolic !== null && diastolic !== null && systolic <= diastolic)
    errors.systolicBp = "Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.";
  const fvc = parseNumber(draft.fvcL);
  const fev1 = parseNumber(draft.fev1L);
  if (!errors.fev1L && fvc !== null && fev1 !== null && fev1 > fvc)
    errors.fev1L = "FEV1 không được lớn hơn FVC.";
  return errors;
}

export function toVisitClinical(draft: VisitDraft): VisitClinical {
  const number = (key: NumberKey) => parseNumber(draft[key]);
  const smoker = draft.smoker === "yes" ? true : draft.smoker === "no" ? false : null;
  return {
    visitDate: draft.visitDate,
    industry: draft.industry.trim() || null,
    yearsInJob: number("yearsInJob"),
    province: draft.province.trim() || null,
    yearsExposed: number("yearsExposed"),
    heightCm: number("heightCm"),
    weightKg: number("weightKg"),
    systolicBp: number("systolicBp"),
    diastolicBp: number("diastolicBp"),
    pulse: number("pulse"),
    smoker,
    // A non-smoker smokes zero cigarettes; the field is hidden in that case.
    cigarettesPerDay: smoker === false ? null : number("cigarettesPerDay"),
    fvcL: number("fvcL"),
    fev1L: number("fev1L"),
  };
}
