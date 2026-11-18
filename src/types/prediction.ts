export type PredictionStatus = "SUCCESS" | "FAILED";

/** Clinical input of the New Way model: column → number or unaccented code / free text. */
export type LamSang = Record<string, string | number>;

export interface PredictionImage {
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/** One screening ("lượt chẩn đoán"): what was sent and the model's result. Never edited after it is created;
 *  only a FAILED one can be retried, which overwrites its result. */
export interface Prediction {
  id: string;
  /** The person screened; enough for admin lists. */
  user: { id: string; code: string | null; fullName: string } | null;
  examDate: string;
  /** Includes gender and birth year copied from the profile when the screening was made. */
  lamSang: LamSang;
  /** Null when no X-ray was sent; the picture itself is at /api/predictions/{id}/image. */
  image: PredictionImage | null;
  status: PredictionStatus;
  errorCode: string | null;
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
  modelName: string | null;
  modelVersion: string | null;
  createdAt: string;
  updatedAt: string;
  experimental: boolean;
  disclaimer: string;
}

/** What the web form sends in one request. */
export interface PredictionInput {
  examDate: string;
  lamSang: LamSang;
  image: File | null;
}

/** Outcome as shown in lists and the dashboard. */
export type PredictionOutcome = "Co" | "Khong" | "FAILED";
