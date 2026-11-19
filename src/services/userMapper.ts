import type { Gender, ProfileInput, Role, TieuSu, User } from "@/types/user";

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
  tieuSu: TieuSu | null;
}

export interface ApiProfile {
  fullName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  gender: ApiGender | null;
  /** null keeps the saved tiểu sử. */
  tieuSu: TieuSu | null;
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
    tieuSu: user.tieuSu ?? {},
  };
}

/** PUT /api/users/me overwrites every account field, so they are always all sent; tiểu sử only when given. */
export function toApiProfile(input: ProfileInput): ApiProfile {
  const blank = (value: string) => value.trim() || null;
  return {
    fullName: input.name.trim(),
    email: input.email.trim(),
    phone: blank(input.phone),
    birthDate: blank(input.birthDate),
    gender: input.gender ? (input.gender.toUpperCase() as ApiGender) : null,
    tieuSu: input.tieuSu ?? null,
  };
}
