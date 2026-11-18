import type { Gender, ProfileInput, Role, User } from "@/types/user";

// The only place that knows the backend's user shape (silicosis-backend/docs/api-auth.md).

type ApiRole = "USER" | "ADMIN";
type ApiGender = "MALE" | "FEMALE" | "OTHER";

export interface ApiUser {
  id: string;
  code: string | null;
  email: string;
  phone: string | null;
  fullName: string;
  role: ApiRole;
  enabled: boolean;
  birthDate: string | null;
  gender: ApiGender | null;
  occupation: string | null;
  workplace: string | null;
  exposureHistory: string | null;
  riskFactors: string | null;
}

export interface ApiProfile {
  fullName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  gender: ApiGender | null;
  occupation: string | null;
  workplace: string | null;
  exposureHistory: string | null;
  riskFactors: string | null;
}

const ROLE_FROM_API: Record<ApiRole, Role> = { USER: "patient", ADMIN: "admin" };

export function toUser(user: ApiUser): User {
  return {
    id: user.id,
    code: user.code || "",
    name: user.fullName,
    email: user.email,
    phone: user.phone || "",
    role: ROLE_FROM_API[user.role],
    active: user.enabled,
    birthDate: user.birthDate || "",
    gender: (user.gender?.toLowerCase() as Gender | undefined) || "",
    occupation: user.occupation || "",
    workplace: user.workplace || "",
    exposureHistory: user.exposureHistory || "",
    riskFactors: user.riskFactors || "",
  };
}

/** PUT /api/users/me overwrites every field, so the whole profile is always sent. */
export function toApiProfile(input: ProfileInput): ApiProfile {
  const blank = (value: string) => value.trim() || null;
  return {
    fullName: input.name.trim(),
    email: input.email.trim(),
    phone: blank(input.phone),
    birthDate: blank(input.birthDate),
    gender: input.gender ? (input.gender.toUpperCase() as ApiGender) : null,
    occupation: blank(input.occupation),
    workplace: blank(input.workplace),
    exposureHistory: blank(input.exposureHistory),
    riskFactors: blank(input.riskFactors),
  };
}
