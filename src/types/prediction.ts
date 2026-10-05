import type { ClinicalRecord } from "@/types/patient";

export type PredictionLabel = "Normal" | "Silicosis";
export type ReviewDecision = "agree" | "disagree" | "further_testing";
export type PredictionScenario = "silicosis" | "normal" | "invalid_image" | "model_error";

export interface XrayImage {
  name: string;
  url: string;
  size: number;
  width: number;
  height: number;
}

export interface MedicalReview {
  decision: ReviewDecision;
  note: string;
  doctorName: string;
  reviewedAt: string;
}

export interface Prediction {
  id: string;
  patientId: string;
  createdAt: string;
  label: PredictionLabel;
  confidence: number;
  modelVersion: string;
  performedBy: string;
  image: XrayImage;
  clinicalRecords: ClinicalRecord[];
  review?: MedicalReview;
  adminNote: string;
  evaluation: "unreviewed" | "correct" | "incorrect";
}

export interface PredictionInput {
  patientId: string;
  image: XrayImage;
  clinicalRecords: ClinicalRecord[];
  scenario: PredictionScenario;
}
