import { CLINICAL_FIELDS, CLINICAL_MAX_TEXT } from "@/constants/clinicalFields";
import type { ClinicalField } from "@/constants/clinicalFields";
import type { LamSang } from "@/types/visit";

// Form state of the New Way clinical fields. Every value is a string; "" means "not recorded".

export type ClinicalDraft = Record<string, string>;

export function emptyClinicalDraft(): ClinicalDraft {
  return Object.fromEntries(CLINICAL_FIELDS.map((field) => [field.key, ""]));
}

/** Accepts a decimal comma ("3,5"); null for an empty or unreadable value. */
export function parseClinicalNumber(value: string): number | null {
  const text = value.trim().replace(",", ".");
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

/** A follow-up question is shown only while its main question has the triggering answer. */
export function isVisible(field: ClinicalField, draft: ClinicalDraft) {
  return !field.parent || draft[field.parent.key] === field.parent.when;
}

/** Changes one value; that question's follow-ups are cleared when they become hidden. Hidden values are never
 *  sent (toLamSang); other hidden values (e.g. imported from a file) are kept until their main question changes. */
export function setClinicalValue(draft: ClinicalDraft, key: string, value: string): ClinicalDraft {
  const next = { ...draft, [key]: value };
  for (const field of CLINICAL_FIELDS)
    if (field.parent?.key === key && !isVisible(field, next)) next[field.key] = "";
  return next;
}

/** Field key → message; empty when the draft can be sent. No field is required. */
export function validateClinicalDraft(draft: ClinicalDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of CLINICAL_FIELDS) {
    const value = (draft[field.key] ?? "").trim();
    if (!value || !isVisible(field, draft)) continue;
    if (field.kind === "so" && parseClinicalNumber(value) === null) errors[field.key] = "Phải là số.";
    if (field.kind === "chu" && value.length > CLINICAL_MAX_TEXT)
      errors[field.key] = `Tối đa ${CLINICAL_MAX_TEXT} ký tự.`;
    if (field.kind === "muc" && !field.options?.some((option) => option.code === value))
      errors[field.key] = "Hãy chọn một giá trị trong danh sách.";
  }
  return errors;
}

/** Only recorded, visible values; numbers as numbers, choices as their unaccented code. */
export function toLamSang(draft: ClinicalDraft): LamSang {
  const out: LamSang = {};
  for (const field of CLINICAL_FIELDS) {
    const value = (draft[field.key] ?? "").trim();
    if (!value || !isVisible(field, draft)) continue;
    out[field.key] = field.kind === "so" ? (parseClinicalNumber(value) ?? value) : value;
  }
  return out;
}

export function hasClinicalValue(draft: ClinicalDraft) {
  return Object.keys(toLamSang(draft)).length > 0;
}

/** Server errors arrive as `extra.lam_sang.<column>`; this maps them back to the form keys. */
export function clinicalServerErrors(fieldErrors: Record<string, string>): Record<string, string> {
  const prefix = "extra.lam_sang.";
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, message]) => [key.slice(prefix.length), message]),
  );
}
