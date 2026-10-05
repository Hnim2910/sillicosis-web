import { demoAccounts } from "@/data/mockData";
import type { AccountInput, ProfileInput } from "@/types/user";
import {
  currentUser,
  delay,
  readDatabase,
  requireUser,
  setSession,
  writeDatabase,
} from "@/services/mockStore";
import { createAccount, validateAccount } from "@/services/userService";
import { validContact, normalizePhone, validPastDate } from "@/utils/validation";

export const authService = {
  async getDemoAccounts() {
    await delay(50);
    return structuredClone(demoAccounts);
  },
  async getCurrentUser() {
    await delay(50);
    return currentUser();
  },
  async login(identifier: string, password: string) {
    await delay(500);
    const database = readDatabase();
    const user = database.users.find(
      (entry) =>
        (!!entry.email && entry.email.toLowerCase() === identifier.trim().toLowerCase()) ||
        (!!entry.phone && normalizePhone(entry.phone) === normalizePhone(identifier.trim())),
    );
    if (!user || database.passwords[user.id] !== password)
      throw new Error("Email, số điện thoại hoặc mật khẩu không chính xác.");
    if (!user.active) throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
    setSession(user.id);
    return user;
  },
  async logout() {
    setSession(null);
  },
  async register(input: Omit<AccountInput, "role">) {
    await delay(450);
    const database = readDatabase();
    validateAccount(database, { ...input, role: "patient" });
    const user = createAccount(database, { ...input, role: "patient" });
    writeDatabase(database);
    return user;
  },
  async updateProfile(input: ProfileInput) {
    await delay();
    const database = readDatabase();
    const user = requireUser(database);
    if (input.name.trim().length < 2 || !validContact(input.email, input.phone))
      throw new Error("Vui lòng kiểm tra họ tên, email và số điện thoại.");
    if (input.birthDate && !validPastDate(input.birthDate))
      throw new Error("Ngày sinh không hợp lệ.");
    if (
      database.users.some(
        (entry) =>
          entry.id !== user.id &&
          ((!!input.email.trim() &&
            entry.email.toLowerCase() === input.email.trim().toLowerCase()) ||
            (!!input.phone && normalizePhone(entry.phone) === normalizePhone(input.phone))),
      )
    )
      throw new Error("Email hoặc số điện thoại đã được sử dụng.");
    Object.assign(user, input, {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: normalizePhone(input.phone),
    });
    const patient = database.patients.find((entry) => entry.id === user.patientId);
    if (patient)
      Object.assign(patient, {
        name: user.name,
        birthDate: user.birthDate,
        phone: user.phone,
        gender: user.gender,
        occupation: user.occupation,
      });
    writeDatabase(database);
    window.dispatchEvent(new Event("silicosis-session"));
    return user;
  },
  async changePassword(oldPassword: string, newPassword: string) {
    await delay();
    const database = readDatabase();
    const user = requireUser(database);
    if (database.passwords[user.id] !== oldPassword)
      throw new Error("Mật khẩu hiện tại không chính xác.");
    if (newPassword.length < 8) throw new Error("Mật khẩu mới phải có ít nhất 8 ký tự.");
    database.passwords[user.id] = newPassword;
    writeDatabase(database);
  },
};
