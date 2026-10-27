import type { Patient, PatientInput } from "@/types/patient";
import type { Gender } from "@/types/user";
import { apiAllPages, apiRequest } from "@/lib/apiClient";
import { validatePatient } from "@/utils/validation";

// Backend shape: silicosis-backend/docs/api-patients.md.
type ApiGender = "MALE" | "FEMALE" | "OTHER";

interface ApiPatient {
  id: string;
  code: string;
  userId: string | null;
  fullName: string;
  birthDate: string | null;
  gender: ApiGender | null;
  phone: string | null;
  occupation: string | null;
  workplace: string | null;
  exposureHistory: string | null;
  riskFactors: string | null;
  createdAt: string;
}

function toPatient(patient: ApiPatient): Patient {
  return {
    id: patient.id,
    code: patient.code,
    userId: patient.userId,
    name: patient.fullName,
    birthDate: patient.birthDate || "",
    gender: (patient.gender?.toLowerCase() as Gender | undefined) || "",
    phone: patient.phone || "",
    occupation: patient.occupation || "",
    workplace: patient.workplace || "",
    exposureHistory: patient.exposureHistory || "",
    riskFactors: patient.riskFactors || "",
    createdAt: patient.createdAt,
  };
}

/** PUT overwrites every field, so the whole form is always sent. */
function toRequest(input: PatientInput) {
  const blank = (value: string) => value.trim() || null;
  return {
    fullName: input.name.trim(),
    birthDate: input.birthDate,
    gender: input.gender ? input.gender.toUpperCase() : null,
    phone: blank(input.phone),
    occupation: input.occupation.trim(),
    workplace: blank(input.workplace),
    exposureHistory: blank(input.exposureHistory),
    riskFactors: blank(input.riskFactors),
  };
}

export const patientService = {
  /** Admin only: every patient record. */
  async getPatients() {
    return (await apiAllPages<ApiPatient>("/api/patients")).map(toPatient);
  },
  /** Patient only: the record linked to the signed-in account. */
  async getMine() {
    return toPatient(await apiRequest<ApiPatient>("/api/patients/me"));
  },
  async getPatient(id: string) {
    return toPatient(await apiRequest<ApiPatient>(`/api/patients/${encodeURIComponent(id)}`));
  },
  async save(input: PatientInput, id?: string) {
    const message = validatePatient(input);
    if (message) throw new Error(message);
    const patient = await apiRequest<ApiPatient>(
      id ? `/api/patients/${encodeURIComponent(id)}` : "/api/patients",
      { method: id ? "PUT" : "POST", body: toRequest(input) },
    );
    return toPatient(patient);
  },
};
