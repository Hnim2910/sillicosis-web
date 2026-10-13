import type { MockDatabase } from "@/types/database";
import type { DemoAccount, User } from "@/types/user";
import type { Patient } from "@/types/patient";
import { MODEL_VERSION } from "@/constants/app";

export const demoAccounts: DemoAccount[] = [
  { name: "Trần Văn Hùng", email: "patient@silicosis.demo", role: "patient" },
  { name: "Phạm Hoàng Nam", email: "admin@silicosis.demo", role: "admin" },
];

const patientSeeds = [
  [
    "BN-0001",
    "Trần Văn Hùng",
    "1978-05-12",
    "male",
    "Khai thác đá",
    "Bình Dương",
    "Tiếp xúc bụi đá trong quá trình cắt và nghiền đá.",
    "Tiền sử hút thuốc",
  ],
  [
    "BN-0002",
    "Nguyễn Thị Mai",
    "1985-09-23",
    "female",
    "Sản xuất gốm",
    "Đồng Nai",
    "Làm việc tại khu vực phối trộn nguyên liệu.",
    "Chưa ghi nhận",
  ],
  [
    "BN-0003",
    "Lê Quốc Bảo",
    "1980-03-08",
    "male",
    "Công nhân xây dựng",
    "TP. Hồ Chí Minh",
    "Tiếp xúc bụi tại công trường xây dựng.",
    "Tiền sử hút thuốc",
  ],
  [
    "BN-0004",
    "Phạm Thanh Sơn",
    "1990-11-17",
    "male",
    "Gia công đá",
    "Bình Dương",
    "Gia công bề mặt đá nhân tạo.",
    "Chưa ghi nhận",
  ],
  [
    "BN-0005",
    "Võ Thị Lan",
    "1988-07-04",
    "female",
    "Sản xuất vật liệu",
    "Long An",
    "Làm việc tại xưởng vật liệu xây dựng.",
    "Chưa ghi nhận",
  ],
  [
    "BN-0006",
    "Đặng Minh Đức",
    "1975-02-19",
    "male",
    "Khai thác khoáng sản",
    "Quảng Ninh",
    "Làm việc trong khu vực khai thác.",
    "Tiền sử hút thuốc",
  ],
] as const;

export function createMockDatabase(): MockDatabase {
  const patients: Patient[] = patientSeeds.map((row, index) => ({
    id: row[0],
    name: row[1],
    birthDate: row[2],
    gender: row[3],
    occupation: row[4],
    workplace: row[5],
    exposureHistory: row[6],
    riskFactors: row[7],
    phone: `090123450${index}`,
    createdAt: "2026-09-01T08:00:00+07:00",
    clinicalRecords: [
      {
        id: `c-${index}-1`,
        date: "2026-06-05",
        exposureYears: 8 + index,
        dustLevel: 0.3 + index / 10,
        fvc: 85 - index,
        fev1: 81 - index,
      },
      {
        id: `c-${index}-2`,
        date: "2026-09-05",
        exposureYears: 8 + index,
        dustLevel: 0.4 + index / 10,
        fvc: 84 - index,
        fev1: 80 - index,
      },
    ],
  }));
  const users: User[] = demoAccounts.map((account) => ({
    id: account.role === "patient" ? "user-2" : "user-4",
    name: account.name,
    email: account.email,
    phone: account.role === "patient" ? "0912345671" : "0912345673",
    role: account.role,
    active: true,
    patientId: account.role === "patient" ? patients[0].id : undefined,
    birthDate: account.role === "patient" ? patients[0].birthDate : "1988-04-16",
    gender: "male",
    occupation: account.role === "patient" ? patients[0].occupation : "Nhân viên y tế",
  }));
  return {
    version: 1,
    users,
    patients,
    predictions: Array.from({ length: 8 }, (_, index) => ({
      id: `PR-2026-${String(index + 1).padStart(4, "0")}`,
      patientId: patients[index % patients.length].id,
      createdAt: `2026-10-0${(index % 4) + 1}T${String(9 + index).padStart(2, "0")}:30:00+07:00`,
      label: index % 3 === 0 ? "Silicosis" : "Normal",
      confidence: [93.6, 96.2, 91.8, 88.4, 97.1, 94.3, 90.5, 95.7][index],
      modelVersion: MODEL_VERSION,
      performedBy: patients[index % patients.length].name,
      image: {
        name: `xray-demo-${index + 1}.svg`,
        url: "/images/xray-demo.svg",
        size: 2048,
        width: 600,
        height: 640,
      },
      clinicalRecords: structuredClone(patients[index % patients.length].clinicalRecords),
      adminNote: "",
      evaluation: "unreviewed",
    })),
  };
}
