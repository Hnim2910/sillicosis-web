import type { Prediction, PredictionInput } from "@/types/prediction";
import { MODEL_VERSION } from "@/constants/app";
import {
  createId,
  delay,
  readDatabase,
  requirePatientAccess,
  requireUser,
  writeDatabase,
} from "@/services/mockStore";
import { validateClinicalRecords } from "@/utils/validation";

export const predictionService = {
  async list(patientId?: string) {
    await delay();
    const database = readDatabase();
    const user = requireUser(database);
    if (patientId) requirePatientAccess(database, patientId);
    return database.predictions
      .filter(
        (entry) =>
          (user.role !== "patient" || entry.patientId === user.patientId) &&
          (!patientId || entry.patientId === patientId),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async get(id: string) {
    await delay();
    const database = readDatabase();
    requireUser(database);
    const prediction = database.predictions.find((entry) => entry.id === id);
    if (!prediction) throw new Error("Bản ghi không tồn tại hoặc đã bị xóa.");
    requirePatientAccess(database, prediction.patientId);
    return {
      prediction,
      patient: database.patients.find((entry) => entry.id === prediction.patientId)!,
    };
  },
  async predict(input: PredictionInput) {
    await delay(1800);
    const database = readDatabase();
    const user = requirePatientAccess(database, input.patientId);
    if (user.role === "admin") throw new Error("Vai trò quản trị viên không thực hiện dự đoán.");
    const message = validateClinicalRecords(input.clinicalRecords);
    if (message) throw new Error(message);
    if (!input.image.url || !input.image.name)
      throw new Error("Vui lòng chọn ảnh trước khi dự đoán.");
    // Explicit scenarios exercise the UI; no medical inference is performed.
    if (input.scenario === "invalid_image")
      throw new Error(
        "Kịch bản demo: ảnh không phải X-quang ngực phù hợp. Vui lòng chọn ảnh khác.",
      );
    if (input.scenario === "model_error")
      throw new Error(
        "Kịch bản demo: mô hình tạm thời không khả dụng. Hãy thử lại với kịch bản Normal hoặc Silicosis.",
      );
    const prediction: Prediction = {
      id: createId("PR"),
      patientId: input.patientId,
      createdAt: new Date().toISOString(),
      label: input.scenario === "normal" ? "Normal" : "Silicosis",
      confidence: input.scenario === "normal" ? 96.2 : 93.6,
      modelVersion: MODEL_VERSION,
      performedBy: user.name,
      image: input.image,
      clinicalRecords: structuredClone(input.clinicalRecords),
      adminNote: "",
      evaluation: "unreviewed",
    };
    database.predictions.unshift(prediction);
    database.patients.find((entry) => entry.id === input.patientId)!.clinicalRecords =
      structuredClone(input.clinicalRecords);
    writeDatabase(database);
    return prediction;
  },
  async updateRecord(id: string, adminNote: string, evaluation: Prediction["evaluation"]) {
    await delay();
    const database = readDatabase();
    requireUser(database, ["admin"]);
    const prediction = database.predictions.find((entry) => entry.id === id);
    if (!prediction) throw new Error("Bản ghi không tồn tại.");
    Object.assign(prediction, { adminNote, evaluation });
    writeDatabase(database);
  },
  async remove(id: string) {
    await delay();
    const database = readDatabase();
    requireUser(database, ["admin"]);
    if (!database.predictions.some((entry) => entry.id === id))
      throw new Error("Bản ghi không tồn tại.");
    database.predictions = database.predictions.filter((entry) => entry.id !== id);
    writeDatabase(database);
  },
};
