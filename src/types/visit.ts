export type PredictionStatus = "SUCCESS" | "FAILED";
/** "Co" = the model flags silicosis; "Khong" = it does not. */
export type PredictionLabel = "Co" | "Khong";

export interface Prediction {
  id: string;
  visitId: string;
  imageId: string;
  status: PredictionStatus;
  /** Probability of the "Co" class, 0–1; null when the prediction failed. */
  probability: number | null;
  label: PredictionLabel | null;
  threshold: number | null;
  modelName: string | null;
  modelVersion: string | null;
  errorCode: string | null;
  createdAt: string;
  experimental: boolean;
  disclaimer: string;
}

export interface VisitImage {
  id: string;
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/** Clinical values of one visit. They are stored only; the model reads the image alone. */
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
  image: VisitImage | null;
  latestPrediction: Prediction | null;
  createdAt: string;
  updatedAt: string;
}

export type VisitInput = VisitClinical & { imageId: string | null };

/** Outcome of a visit as shown in lists and the dashboard. */
export type VisitOutcome = "Co" | "Khong" | "FAILED" | "NONE";
