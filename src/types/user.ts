export type Role = "patient" | "admin";
export type Gender = "male" | "female" | "other";

/** Tiểu sử: clinical form column → value (same codes as the screening form, see TIEU_SU_KEYS). */
export type TieuSu = Record<string, string | number>;

/** An account; a patient account is also the patient record (code, tiểu sử…). */
export interface User {
  id: string;
  /** Patient code such as BN-000001; empty for admins. */
  code: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  birthDate: string;
  /** Empty when the account has not set a gender yet. */
  gender: Gender | "";
  /** Empty object when not filled in yet. */
  tieuSu: TieuSu;
}

export interface AccountInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

/** What PUT /api/users/me takes; `tieuSu` left out keeps the saved one. */
export type ProfileInput = Pick<User, "name" | "email" | "phone" | "birthDate" | "gender"> & {
  tieuSu?: TieuSu;
};
