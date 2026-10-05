import type { Gender } from "@/types/user";

export interface ClinicalRecord {
  id: string;
  date: string;
  exposureYears: number;
  dustLevel: number;
  fvc: number;
  fev1: number;
}

export interface PatientInput {
  name: string;
  birthDate: string;
  gender: Gender;
  phone: string;
  occupation: string;
  workplace: string;
  exposureHistory: string;
  riskFactors: string;
}

export interface Patient extends PatientInput {
  id: string;
  createdAt: string;
  clinicalRecords: ClinicalRecord[];
}
