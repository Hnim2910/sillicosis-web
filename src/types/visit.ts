export type PredictionStatus = "SUCCESS" | "FAILED";
/** Final conclusion of the New Way model: "Co" = at risk (see a specialist), "Khong" = low risk. */
export type PredictionLabel = "Co" | "Khong";

export interface Prediction {
  id: string;
  visitId: string;
  /** Null for a clinical-only prediction. */
  imageId: string | null;
  status: PredictionStatus;
  /** Score behind the final conclusion (pGhep with an image, else pLamSang), 0–1; null when failed. */
  probability: number | null;
  label: PredictionLabel | null;
  threshold: number | null;
  modelName: string | null;
  modelVersion: string | null;
  errorCode: string | null;
  createdAt: string;
  /** New Way scores; null when failed. The image ones are null without an image. */
  pLamSang: number | null;
  nguongLamSang: number | null;
  baoNguyCoLamSang: boolean | null;
  coAnh: boolean | null;
  pAnh: number | null;
  pGhep: number | null;
  nguongGhep: number | null;
  baoNguyCoGhep: boolean | null;
  ketLuanCuoi: boolean | null;
  experimental: boolean;
  disclaimer: string;
}

/** visits.extra.lam_sang: model column → number or unaccented code / free text. */
export type LamSang = Record<string, string | number>;

export interface VisitImage {
  id: string;
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/** Old clinical columns of a visit; kept for visits entered before the New Way form (not model inputs). */
export interface VisitClinical {
  visitDate: string;
  industry: string | null;
  yearsInJob: number | null;
  province: string | null;
  yearsExposed: number | null;
  heightCm: number | null;
  weightKg: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  pulse: number | null;
  smoker: boolean | null;
  cigarettesPerDay: number | null;
  fvcL: number | null;
  fev1L: number | null;
}

export interface Visit extends VisitClinical {
  id: string;
  patientId: string;
  patient: { id: string; code: string; fullName: string };
  ageAtVisit: number | null;
  bmi: number | null;
  extra: { lam_sang?: LamSang; [key: string]: unknown } | null;
  image: VisitImage | null;
  latestPrediction: Prediction | null;
  createdAt: string;
  updatedAt: string;
}

/** What the web form sends: the date plus the New Way clinical values in extra.lam_sang. */
export interface VisitInput {
  visitDate: string;
  extra: { lam_sang: LamSang };
  imageId: string | null;
}

/** Outcome of a visit as shown in lists and the dashboard. */
export type VisitOutcome = "Co" | "Khong" | "FAILED" | "NONE";
