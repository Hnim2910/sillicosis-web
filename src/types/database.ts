import type { Patient } from "@/types/patient";
import type { Prediction } from "@/types/prediction";
import type { User } from "@/types/user";

export interface MockDatabase {
  version: 1;
  users: User[];
  patients: Patient[];
  predictions: Prediction[];
}
