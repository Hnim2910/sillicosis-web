import type { PatientInput } from "@/types/patient";
import { today } from "@/utils/format";

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

export function validPastDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > today()) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validatePatient(input: PatientInput) {
  if (input.name.trim().length < 2) return "Họ tên phải có ít nhất 2 ký tự.";
  if (!validPastDate(input.birthDate)) return "Ngày sinh không hợp lệ.";
  if (!input.occupation.trim()) return "Vui lòng nhập nghề nghiệp.";
  if (!validVnMobile(input.phone)) return "Số điện thoại di động Việt Nam không hợp lệ.";
  return "";
}
