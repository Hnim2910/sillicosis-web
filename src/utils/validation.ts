import type { ClinicalRecord, PatientInput } from "@/types/patient";
import { today } from "@/utils/format";

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
export function validPhone(value: string) {
  return !value || /^\+?\d{9,15}$/.test(normalizePhone(value));
}

export function normalizePhone(value: string) {
  return value.replace(/[\s()-]/g, "");
}

/** Same rule as the backend: 8–72 characters with at least one letter and one digit. */
export function validPassword(value: string) {
  return /^(?=.*\p{L})(?=.*\d).{8,72}$/u.test(value);
}
export const PASSWORD_RULE = "8–72 ký tự, có ít nhất 1 chữ cái và 1 chữ số.";

/** Vietnamese mobile number; the backend normalises it and has the final say. */
export function validVnMobile(value: string) {
  return !value.trim() || /^(?:\+?84|0)[35789]\d{8}$/.test(value.replace(/[\s.()-]/g, ""));
}

export function validContact(email: string, phone: string) {
  return (
    !!(email.trim() || phone.trim()) &&
    (!email.trim() || validEmail(email.trim())) &&
    validPhone(phone)
  );
}

export function validPastDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > today()) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validatePatient(input: PatientInput) {
  if (input.name.trim().length < 2) return "Họ tên phải có ít nhất 2 ký tự.";
  if (!validPastDate(input.birthDate)) return "Ngày sinh không hợp lệ.";
  if (!input.occupation.trim()) return "Vui lòng nhập nghề nghiệp.";
  if (!validPhone(input.phone)) return "Số điện thoại không hợp lệ.";
  return "";
}

export function validateClinicalRecords(records: ClinicalRecord[]) {
  if (!records.length) return "Cần ít nhất một mốc theo dõi trước khi dự đoán.";
  if (records.length > 100) return "Mỗi lần nhập tối đa 100 mốc theo dõi.";
  const dates = new Set<string>();
  for (const [index, row] of records.entries()) {
    const prefix = `Dòng ${index + 1}: `;
    if (!validPastDate(row.date)) return prefix + "ngày theo dõi không hợp lệ.";
    if (dates.has(row.date)) return prefix + "mốc thời gian bị trùng.";
    dates.add(row.date);
    if (![row.exposureYears, row.dustLevel, row.fvc, row.fev1].every(Number.isFinite))
      return prefix + "các chỉ số phải là số và không được để trống.";
    if (
      row.exposureYears < 0 ||
      row.exposureYears > 80 ||
      row.dustLevel < 0 ||
      row.dustLevel > 100 ||
      row.fvc <= 0 ||
      row.fvc > 150 ||
      row.fev1 <= 0 ||
      row.fev1 > 150
    )
      return prefix + "chỉ số nằm ngoài phạm vi nhập liệu của bản demo.";
  }
  return "";
}
