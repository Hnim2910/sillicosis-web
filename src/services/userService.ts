import type { MockDatabase } from "@/types/database";
import type { AccountInput, User } from "@/types/user";
import { createId, delay, readDatabase, requireUser, writeDatabase } from "@/services/mockStore";
import { validContact, normalizePhone } from "@/utils/validation";
import { ROLE_LABELS } from "@/constants/app";

export function validateAccount(database: MockDatabase, input: AccountInput, excludeId?: string) {
  if (input.name.trim().length < 2 || !validContact(input.email, input.phone))
    throw new Error("Vui lòng nhập họ tên, email và số điện thoại hợp lệ.");
  if ((!excludeId || input.password) && input.password.length < 8)
    throw new Error("Mật khẩu phải có ít nhất 8 ký tự.");
  if (!(Object.hasOwn(ROLE_LABELS, input.role))) throw new Error("Vai trò không hợp lệ.");
  if (
    database.users.some(
      (user) =>
        user.id !== excludeId &&
        ((!!input.email.trim() && user.email.toLowerCase() === input.email.trim().toLowerCase()) ||
          (!!input.phone && normalizePhone(input.phone) === normalizePhone(user.phone))),
    )
  )
    throw new Error("Email hoặc số điện thoại đã tồn tại.");
}

function linkPatient(database: MockDatabase, user: User) {
  if (user.role !== "patient" || user.patientId) return;
  user.patientId = createId("BN");
  database.patients.push({
    id: user.patientId,
    name: user.name,
    birthDate: user.birthDate,
    gender: user.gender || "other",
    phone: user.phone,
    occupation: user.occupation,
    workplace: "",
    exposureHistory: "",
    riskFactors: "",
    createdAt: new Date().toISOString(),
    clinicalRecords: [],
  });
}

export function createAccount(database: MockDatabase, input: AccountInput) {
  const user: User = {
    id: createId("USER"),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: normalizePhone(input.phone),
    role: input.role,
    active: true,
    birthDate: "",
    gender: "other",
    occupation: "",
  };
  database.users.push(user);
  linkPatient(database, user);
  return user;
}

export const userService = {
  async list() {
    await delay();
    const database = readDatabase();
    requireUser(database, ["admin"]);
    return database.users;
  },
  async save(input: AccountInput, id?: string) {
    await delay();
    const database = readDatabase();
    const current = requireUser(database, ["admin"]);
    validateAccount(database, input, id);
    if (id === current.id && input.role !== "admin")
      throw new Error("Bạn không thể tự thay đổi vai trò quản trị viên của mình.");
    if (id) {
      const user = database.users.find((entry) => entry.id === id);
      if (!user) throw new Error("Tài khoản không tồn tại.");
      Object.assign(user, {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: normalizePhone(input.phone),
        role: input.role,
      });
      linkPatient(database, user);
      const patient = database.patients.find((entry) => entry.id === user.patientId);
      if (patient) Object.assign(patient, { name: user.name, phone: user.phone });
    } else createAccount(database, input);
    writeDatabase(database);
    window.dispatchEvent(new Event("silicosis-session"));
  },
  async changeStatus(id: string, action: "lock" | "unlock" | "delete") {
    await delay();
    const database = readDatabase();
    const current = requireUser(database, ["admin"]);
    if (id === current.id) throw new Error("Không thể tự khóa hoặc xóa tài khoản của mình.");
    const user = database.users.find((entry) => entry.id === id);
    if (!user) throw new Error("Tài khoản không tồn tại.");
    if (action === "delete") {
      database.users = database.users.filter((entry) => entry.id !== id);
    } else user.active = action === "unlock";
    writeDatabase(database);
  },
};
