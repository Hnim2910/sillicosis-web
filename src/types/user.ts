export type Role = "patient" | "admin";
export type Gender = "male" | "female" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  patientId?: string;
  birthDate: string;
  /** Empty when the account has not set a gender yet. */
  gender: Gender | "";
  occupation: string;
}

export interface AccountInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export type ProfileInput = Pick<
  User,
  "name" | "email" | "phone" | "birthDate" | "gender" | "occupation"
>;
export interface DemoAccount {
  name: string;
  email: string;
  role: Role;
}
