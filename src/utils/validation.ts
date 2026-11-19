import { today } from "@/utils/format";

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Requirements of a new password, in display order (same rule as the backend's @StrongPassword). */
export const PASSWORD_REQUIREMENTS: {
  id: string;
  label: string;
  test: (value: string) => boolean;
}[] = [
  {
    id: "length",
    label: "Từ 8 đến 72 ký tự",
    test: (value) => value.length >= 8 && value.length <= 72,
  },
  { id: "lower", label: "Có ít nhất 1 chữ thường (a–z)", test: (value) => /\p{Ll}/u.test(value) },
  { id: "upper", label: "Có ít nhất 1 chữ hoa (A–Z)", test: (value) => /\p{Lu}/u.test(value) },
  { id: "digit", label: "Có ít nhất 1 chữ số (0–9)", test: (value) => /\d/.test(value) },
  {
    id: "special",
    label: "Có ít nhất 1 ký tự đặc biệt (ví dụ ! @ # $ % & *)",
    test: (value) => /[^\p{L}\d\s]/u.test(value),
  },
  { id: "space", label: "Không chứa khoảng trắng", test: (value) => !!value && !/\s/.test(value) },
];

export function validPassword(value: string) {
  return PASSWORD_REQUIREMENTS.every((rule) => rule.test(value));
}
export const PASSWORD_RULE =
  "8–72 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt, không chứa khoảng trắng.";

/** Vietnamese mobile number; the backend normalises it and has the final say. */
export function validVnMobile(value: string) {
  return !value.trim() || /^(?:\+?84|0)[35789]\d{8}$/.test(value.replace(/[\s.()-]/g, ""));
}

export function validPastDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1900-01-01" || value > today()) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
