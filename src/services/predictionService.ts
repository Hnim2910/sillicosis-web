import type { Prediction, PredictionInput, PredictionOutcome } from "@/types/prediction";
import { apiAllPages, apiBlob, apiRequest } from "@/lib/apiClient";

// Backend shape: silicosis-backend/docs/api-predictions.md. Numbers arrive as JSON numbers.

const path = (id: string) => `/api/predictions/${encodeURIComponent(id)}`;

export function predictionOutcome(prediction: Prediction): PredictionOutcome {
  if (prediction.status === "FAILED") return "FAILED";
  return prediction.ketLuanCuoi ? "Co" : "Khong";
}

export const predictionService = {
  /** The signed-in account's screenings, newest first. */
  listMine() {
    return apiAllPages<Prediction>("/api/predictions");
  },
  /** Admin only: screenings of every patient. */
  listAll() {
    return apiAllPages<Prediction>("/api/predictions/all");
  },
  get(id: string) {
    return apiRequest<Prediction>(path(id));
  },
  /** One multipart request: the data part (JSON) and the X-ray if any. The backend runs the model before
   *  answering; a model failure still answers 201 with status FAILED. */
  create(input: PredictionInput) {
    const form = new FormData();
    form.append(
      "data",
      new Blob([JSON.stringify({ examDate: input.examDate, lamSang: input.lamSang })], {
        type: "application/json",
      }),
    );
    if (input.image) form.append("file", input.image);
    return apiRequest<Prediction>("/api/predictions", { method: "POST", body: form });
  },
  /** Only for a FAILED screening; the result is written back on the same screening. */
  retry(id: string) {
    return apiRequest<Prediction>(`${path(id)}/retry`, { method: "POST" });
  },
  remove(id: string) {
    return apiRequest(path(id), { method: "DELETE" });
  },
  /** Object URL of the screening's X-ray (the endpoint needs the Bearer token). Revoke it when done. */
  async imageUrl(id: string) {
    return URL.createObjectURL(await apiBlob(`${path(id)}/image`));
  },
};
