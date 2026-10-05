import { patientService } from "@/services/patientService";
import { predictionService } from "@/services/predictionService";

export const dashboardService = {
  async getOverview() {
    const [patients, records] = await Promise.all([
      patientService.getPatients(),
      predictionService.list(),
    ]);
    return {
      patients,
      records,
      total: records.length,
      silicosis: records.filter((record) => record.label === "Silicosis").length,
      normal: records.filter((record) => record.label === "Normal").length,
      pending: records.filter((record) => !record.review).length,
    };
  },
};
