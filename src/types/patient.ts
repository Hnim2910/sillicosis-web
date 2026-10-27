import type { Gender } from "@/types/user";

export interface PatientInput {
  name: string;
  birthDate: string;
  /** Empty when the record has no gender yet. */
  gender: Gender | "";
  phone: string;
  occupation: string;
  workplace: string;
  exposureHistory: string;
  riskFactors: string;
}

export interface Patient extends PatientInput {
  id: string;
  /** Human-readable code such as BN-000001. */
  code: string;
  /** Linked account; null for records an admin created without one. */
  userId: string | null;
  createdAt: string;
}
