import type { Role } from "@/types/user";
import type { VisitOutcome } from "@/types/visit";
import { apiRequest } from "@/lib/apiClient";
import type { PageResponse } from "@/lib/apiClient";
import { patientService } from "@/services/patientService";
import { visitOutcome, visitService } from "@/services/visitService";

export const dashboardService = {
  /** Admin: every patient and visit. Patient: the signed-in account's own visits. */
  async getOverview(role: Role) {
    const [patients, visits] =
      role === "admin"
        ? await Promise.all([
            apiRequest<PageResponse<unknown>>("/api/patients?size=1").then(
              (page) => page.totalElements,
            ),
            visitService.listAll(),
          ])
        : [1, await visitService.listForPatient((await patientService.getMine()).id)];
    const counts: Record<VisitOutcome, number> = { Co: 0, Khong: 0, FAILED: 0, NONE: 0 };
    for (const visit of visits) counts[visitOutcome(visit)] += 1;
    return { patients, visits, counts };
  },
};
