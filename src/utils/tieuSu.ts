import { CLINICAL_FIELD_BY_KEY, TIEU_SU_KEYS } from "@/constants/clinicalFields";
import type { ProfileInput, TieuSu, User } from "@/types/user";
import { isVisible, parseClinicalNumber, toLamSang } from "@/utils/clinicalForm";
import type { ClinicalDraft } from "@/utils/clinicalForm";
import { formatClinicalValue } from "@/utils/predictionDisplay";

// Tiểu sử ↔ profile. The profile keeps gender and the full birth date in their own columns and every other tiểu sử
// field in `tieuSu` with the clinical form's codes, so the screening form can be pre-filled as is.

const GENDER_CODE = { male: "Nam", female: "Nu" } as const;

/** Clinical gender code from the profile ("" for none or "other": the model only knows Nam/Nu). */
export function genderCode(user: User): string {
  return user.gender === "male" || user.gender === "female" ? GENDER_CODE[user.gender] : "";
}

/** Birth year as the form shows it; always taken from the saved birth date. */
export function birthYear(user: User): string {
  return user.birthDate ? user.birthDate.slice(0, 4) : "";
}

/** Draft values of the tiểu sử fields, read from the profile. */
export function profileTieuSuDraft(user: User): ClinicalDraft {
  const draft: ClinicalDraft = { gioitinh: genderCode(user), namsinh: birthYear(user) };
  for (const key of TIEU_SU_KEYS) {
    const value = user.tieuSu?.[key];
    draft[key] = value === undefined || value === null ? "" : String(value).replace(".", ",");
  }
  return draft;
}

/** Visible tiểu sử values of a draft, as the backend stores them (numbers as numbers). */
export function tieuSuFromDraft(draft: ClinicalDraft): TieuSu {
  const values = toLamSang(draft);
  return Object.fromEntries(
    TIEU_SU_KEYS.filter((key) => key in values).map((key) => [key, values[key]]),
  );
}

export function hasTieuSu(user: User) {
  return Object.values(user.tieuSu ?? {}).some((value) => String(value).trim() !== "");
}

/** First sign-in (or a profile never filled in): no gender, no birth date and no tiểu sử. */
export function needsProfileSetup(user: User) {
  return user.role === "patient" && !user.gender && !user.birthDate && !hasTieuSu(user);
}

export interface TieuSuChange {
  key: string;
  label: string;
  saved: string;
  current: string;
}

/** Comparable text of one value ("" when empty or hidden), numbers compared as numbers. */
function comparable(key: string, draft: ClinicalDraft): string {
  const field = CLINICAL_FIELD_BY_KEY[key];
  const value = (draft[key] ?? "").trim();
  if (!value || !isVisible(field, draft)) return "";
  if (field.kind === "so") return String(parseClinicalNumber(value) ?? value);
  return value;
}

/**
 * Tiểu sử fields whose value in the screening form differs from the profile. The birth year is not listed: it is
 * always the saved birth date's year (shown read-only), or typed for this screening only when there is none.
 */
export function tieuSuChanges(user: User, draft: ClinicalDraft): TieuSuChange[] {
  const saved = profileTieuSuDraft(user);
  return ["gioitinh", ...TIEU_SU_KEYS]
    .filter((key) => comparable(key, saved) !== comparable(key, draft))
    .map((key) => {
      const field = CLINICAL_FIELD_BY_KEY[key];
      const shown = (source: ClinicalDraft) => {
        const value = comparable(key, source);
        return value
          ? formatClinicalValue(field, field.kind === "so" ? Number(value) : value)
          : "-";
      };
      return { key, label: field.label, saved: shown(saved), current: shown(draft) };
    });
}

/** The whole profile (PUT /api/users/me overwrites everything) with gender and tiểu sử taken from a draft. */
export function profileWithTieuSu(user: User, draft: ClinicalDraft): ProfileInput {
  const gioitinh = (draft.gioitinh ?? "").trim();
  const gender =
    gioitinh === "Nam"
      ? "male"
      : gioitinh === "Nu"
        ? "female"
        : user.gender === "other"
          ? "other"
          : "";
  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    birthDate: user.birthDate,
    gender,
    tieuSu: tieuSuFromDraft(draft),
  };
}
