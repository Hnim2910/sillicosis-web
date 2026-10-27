import type { Prediction, Visit, VisitInput, VisitOutcome } from "@/types/visit";
import { apiAllPages, apiRequest } from "@/lib/apiClient";

// Backend shape: silicosis-backend/docs/api-visits.md. Numbers arrive as JSON numbers.

const path = (id: string) => `/api/visits/${encodeURIComponent(id)}`;

export function visitOutcome(visit: Visit): VisitOutcome {
  const prediction = visit.latestPrediction;
  if (!prediction) return "NONE";
  if (prediction.status === "FAILED") return "FAILED";
  return prediction.label === "Co" ? "Co" : "Khong";
}

export const visitService = {
  listForPatient(patientId: string) {
    return apiAllPages<Visit>(`/api/patients/${encodeURIComponent(patientId)}/visits`);
  },
  /** Admin only: visits of every patient. */
  listAll() {
    return apiAllPages<Visit>("/api/visits");
  },
  get(id: string) {
    return apiRequest<Visit>(path(id));
  },
  /** Creates the visit; with an image the backend runs the prediction before answering. */
  create(patientId: string, input: VisitInput) {
    return apiRequest<Visit>(`/api/patients/${encodeURIComponent(patientId)}/visits`, {
      method: "POST",
      body: input,
    });
  },
  /** Runs the model again on the attached image; a service failure still answers 201 with status FAILED. */
  predict(id: string) {
    return apiRequest<Prediction>(`${path(id)}/predictions`, { method: "POST" });
  },
  /** Admin only. The attached image is kept. */
  remove(id: string) {
    return apiRequest(path(id), { method: "DELETE" });
  },
};
