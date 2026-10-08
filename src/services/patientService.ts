import type { ClinicalRecord, PatientInput } from "@/types/patient";
import {
  createId,
  delay,
  readDatabase,
  requirePatientAccess,
  requireUser,
  writeDatabase,
} from "@/services/mockStore";
import { validateClinicalRecords, validatePatient } from "@/utils/validation";

export const patientService = {
  async getPatients() {
    await delay();
    const database = readDatabase();
    const user = requireUser(database);
    return database.patients.filter(
      (patient) => user.role !== "patient" || patient.id === user.patientId,
    );
  },
  async getPatient(id: string) {
    await delay();
    const database = readDatabase();
    requirePatientAccess(database, id);
    return database.patients.find((entry) => entry.id === id)!;
  },
  async save(input: PatientInput, id?: string) {
    await delay();
    const database = readDatabase();
    requireUser(database, ["admin"]);
    const message = validatePatient(input);
    if (message) throw new Error(message);
    if (id) {
      const patient = database.patients.find((entry) => entry.id === id);
      if (!patient) throw new Error("Không tìm thấy bệnh nhân.");
      Object.assign(patient, input, { name: input.name.trim() });
      const user = database.users.find((entry) => entry.patientId === id);
      if (user)
        Object.assign(user, {
          name: patient.name,
          birthDate: patient.birthDate,
          gender: patient.gender,
          occupation: patient.occupation,
        });
      writeDatabase(database);
      return patient;
    }
    const patient = {
      ...input,
      name: input.name.trim(),
      id: createId("BN"),
      createdAt: new Date().toISOString(),
      clinicalRecords: [],
    };
    database.patients.unshift(patient);
    writeDatabase(database);
    return patient;
  },
  async saveClinicalRecords(id: string, records: ClinicalRecord[]) {
    await delay();
    const database = readDatabase();
    const user = requirePatientAccess(database, id);
    if (user.role === "admin") throw new Error("Quản trị viên không chỉnh sửa dữ liệu lâm sàng.");
    const message = records.length ? validateClinicalRecords(records) : "";
    if (message) throw new Error(message);
    database.patients.find((entry) => entry.id === id)!.clinicalRecords = structuredClone(
      records,
    ).sort((a, b) => a.date.localeCompare(b.date));
    writeDatabase(database);
  },
};
