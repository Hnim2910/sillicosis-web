import type { Role } from "@/types/user";
import type { PredictionOutcome } from "@/types/prediction";
import { apiRequest } from "@/lib/apiClient";
import type { PageResponse } from "@/lib/apiClient";
import { predictionOutcome, predictionService } from "@/services/predictionService";

export const dashboardService = {
  /** Admin: every patient account and screening. Patient: the signed-in account's own screenings. */
  async getOverview(role: Role) {
    const [patients, predictions] =
      role === "admin"
        ? await Promise.all([
            apiRequest<PageResponse<unknown>>("/api/users?role=USER&size=1").then(
              (page) => page.totalElements,
            ),
            predictionService.listAll(),
          ])
        : [1, await predictionService.listMine()];
    const counts: Record<PredictionOutcome, number> = { Co: 0, Khong: 0, FAILED: 0 };
    for (const prediction of predictions) counts[predictionOutcome(prediction)] += 1;
    return { patients, predictions, counts, loadedAt: Date.now() };
  },
};
