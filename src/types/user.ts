export type Role = "patient" | "admin";
export type Gender = "male" | "female" | "other";

/** An account; a patient account is also the patient record (code, workplace, exposure history…). */
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
  occupation: string;
  workplace: string;
  exposureHistory: string;
  riskFactors: string;
}

export interface AccountInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export type ProfileInput = Pick<
  User,
  | "name"
  | "email"
  | "phone"
  | "birthDate"
  | "gender"
  | "occupation"
  | "workplace"
  | "exposureHistory"
  | "riskFactors"
>;
