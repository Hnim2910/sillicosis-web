export type Role = "patient" | "admin";
export type Gender = "male" | "female" | "other";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
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
}

export type ProfileInput = Pick<
  User,
  "name" | "email" | "phone" | "birthDate" | "gender" | "occupation"
>;
