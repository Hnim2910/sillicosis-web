import { expect, test } from "@playwright/test";
import { validPastDate, validatePatient, validVnMobile } from "@/utils/validation";
import { wrapText } from "@/utils/wrapText";
import { emptyVisitDraft, toVisitClinical, validateVisitDraft } from "@/utils/visitForm";
import { visitOutcome } from "@/services/visitService";
import type { Visit } from "@/types/visit";

// Pure functions only: no browser, no backend.

test("calendar validation rejects impossible dates and accepts leap days", () => {
  for (const value of [
    "2025-02-29",
    "2024-02-30",
    "2026-04-31",
    "1900-02-29",
    "2026-13-01",
    "9999-01-01",
    "2026-1-01",
  ]) {
    expect(validPastDate(value), value).toBe(false);
  }
  expect(validPastDate("2000-02-29")).toBe(true);
  expect(validPastDate("2024-02-29")).toBe(true);
  expect(
    validatePatient({
      name: "Bệnh nhân test",
      birthDate: "2025-02-29",
      gender: "",
      phone: "",
      occupation: "Gia công đá",
      workplace: "",
      exposureHistory: "",
      riskFactors: "",
    }),
  ).toBe("Ngày sinh không hợp lệ.");
});

test("Vietnamese mobile numbers follow the backend rule", () => {
  for (const value of ["", "0912345678", "+84912345678", "84 912 345 678"])
    expect(validVnMobile(value), value).toBe(true);
  for (const value of ["0212345678", "091234567", "12345"])
    expect(validVnMobile(value), value).toBe(false);
});

test("visit form applies the backend ranges and cross-field rules", () => {
  expect(validateVisitDraft(emptyVisitDraft())).toEqual({});
  const errors = validateVisitDraft({
    ...emptyVisitDraft(),
    visitDate: "9999-01-01",
    systolicBp: "80",
    diastolicBp: "90",
    fvcL: "3",
    fev1L: "3.5",
    heightCm: "abc",
  });
  expect(Object.keys(errors).sort()).toEqual(["fev1L", "heightCm", "systolicBp", "visitDate"]);
  const clinical = toVisitClinical({ ...emptyVisitDraft(), fvcL: "3.2", smoker: "no" });
  expect(clinical.fvcL).toBe(3.2);
  expect(clinical.smoker).toBe(false);
  expect(clinical.weightKg).toBeNull();
});

test("visit outcome reflects the latest prediction", () => {
  const base = { latestPrediction: null } as unknown as Visit;
  const withPrediction = (status: string, label: string | null) =>
    ({ latestPrediction: { status, label } }) as unknown as Visit;
  expect(visitOutcome(base)).toBe("NONE");
  expect(visitOutcome(withPrediction("FAILED", null))).toBe("FAILED");
  expect(visitOutcome(withPrediction("SUCCESS", "Co"))).toBe("Co");
  expect(visitOutcome(withPrediction("SUCCESS", "Khong"))).toBe("Khong");
});

test("report wrapping preserves long notes and paragraph breaks", () => {
  const longWord = "ghi-chú-".repeat(80);
  const lines = wrapText(`Ghi chú\n\n${longWord}`, (text) => text.length * 9, 450);
  expect(lines[0]).toBe("Ghi chú");
  expect(lines[1]).toBe("");
  expect(lines.slice(2).join("")).toBe(longWord);
  expect(lines.every((line) => line.length <= 50)).toBe(true);
});
