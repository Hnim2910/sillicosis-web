import { expect, test } from "@playwright/test";
import { validPastDate, validatePatient, validVnMobile } from "@/utils/validation";
import { wrapText } from "@/utils/wrapText";
import { emptyVisitDraft, toVisitClinical, validateVisitDraft } from "@/utils/visitForm";
import {
  clinicalServerErrors,
  emptyClinicalDraft,
  setClinicalValue,
  toLamSang,
  validateClinicalDraft,
} from "@/utils/clinicalForm";
import { CLINICAL_FIELDS } from "@/constants/clinicalFields";
import { visitOutcome } from "@/services/visitService";
import type { Prediction, Visit } from "@/types/visit";
import { clinicalRiskLevel, formatChance, mainChance, recommendationText } from "@/utils/visitDisplay";
import { CLINICAL_HIGH_RISK, CLINICAL_RISK_TEXT, RECOMMENDATION_TEXT } from "@/constants/app";

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

test("clinical form sends unaccented codes, numbers and only visible follow-ups", () => {
  const empty = emptyClinicalDraft();
  expect(validateClinicalDraft(empty)).toEqual({});
  expect(toLamSang(empty)).toEqual({});
  let draft = setClinicalValue(empty, "ho", "Co");
  draft = setClinicalValue(draft, "tdho", "Ban dem");
  draft = setClinicalValue(draft, "fvc", "3,5");
  draft = setClinicalValue(draft, "cviec", "  công nhân nghiền đá ");
  draft = setClinicalValue(draft, "theluc", "2");
  expect(toLamSang(draft)).toEqual({
    ho: "Co",
    tdho: "Ban dem",
    fvc: 3.5,
    cviec: "công nhân nghiền đá",
    theluc: "2",
  });
  // Changing the main answer clears its follow-ups.
  draft = setClinicalValue(draft, "ho", "Khong");
  expect(draft.tdho).toBe("");
  expect(toLamSang(draft).tdho).toBeUndefined();
  const errors = validateClinicalDraft({ ...empty, fvc: "abc", gioitinh: "Nữ" });
  expect(Object.keys(errors).sort()).toEqual(["fvc", "gioitinh"]);
  expect(clinicalServerErrors({ "extra.lam_sang.ho": "x", visitDate: "y" })).toEqual({ ho: "x" });
  // No field for job level, province, blocks or B2/B10; codes never carry diacritics.
  const keys = CLINICAL_FIELDS.map((field) => field.key);
  for (const absent of ["tinh", "capbac", "b2", "b10"]) expect(keys).not.toContain(absent);
  for (const field of CLINICAL_FIELDS)
    for (const option of field.options ?? [])
      expect(option.code, field.key).toMatch(/^[ -~]+$/);
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

test("result screen shows a whole-percent chance and a recommendation, never a threshold", () => {
  const base = {
    id: "p", visitId: "v", imageId: null, status: "SUCCESS", probability: 0.3, label: "Co", threshold: 0.2,
    modelName: "m", modelVersion: "1", errorCode: null, createdAt: "2026-01-01T00:00:00Z",
    pLamSang: 0.3, nguongLamSang: 0.2, baoNguyCoLamSang: true, coAnh: false, pAnh: null, pGhep: null,
    nguongGhep: null, baoNguyCoGhep: null, ketLuanCuoi: true, experimental: false, disclaimer: "",
  } as unknown as Prediction;
  expect(formatChance(0.163)).toBe("16%");
  expect(formatChance(0.004)).toBe("<1%");
  expect(mainChance(base)).toBeNull(); // clinical only: no % for now
  // Clinical only: risk level, lower edge = nguong_lam_sang from the response, upper edge CLINICAL_HIGH_RISK.
  const level = (p: number) => clinicalRiskLevel({ ...base, pLamSang: p, nguongLamSang: 0.0515 });
  expect(level(0.04)).toBe("low");
  expect(level(0.0515)).toBe("medium");
  expect(level(0.1)).toBe("medium");
  expect(level(0.15)).toBe("high");
  expect(level(0.163)).toBe("high");
  expect(CLINICAL_HIGH_RISK).toBe(0.15);
  expect(clinicalRiskLevel({ ...base, pLamSang: 0.04, nguongLamSang: 0.03 })).toBe("medium");
  expect(recommendationText({ ...base, pLamSang: 0.04, nguongLamSang: 0.0515 })).toBe(CLINICAL_RISK_TEXT.low.advice);
  expect(recommendationText({ ...base, pLamSang: 0.1, nguongLamSang: 0.0515 })).toBe(CLINICAL_RISK_TEXT.medium.advice);
  expect(recommendationText({ ...base, pLamSang: 0.163, nguongLamSang: 0.0515 })).toBe(CLINICAL_RISK_TEXT.high.advice);
  const withImage = { ...base, coAnh: true, pAnh: 0.7, pGhep: 0.55, ketLuanCuoi: true };
  expect(mainChance(withImage)).toBe(0.55);
  expect(clinicalRiskLevel(withImage)).toBeNull();
  expect(recommendationText(withImage)).toBe(RECOMMENDATION_TEXT.imageAtRisk);
  expect(recommendationText({ ...withImage, ketLuanCuoi: false })).toBe(RECOMMENDATION_TEXT.low);
  expect(mainChance({ ...base, status: "FAILED" })).toBeNull();
});
