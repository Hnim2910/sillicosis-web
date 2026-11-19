import { expect, test } from "@playwright/test";
import { validPastDate, validVnMobile } from "@/utils/validation";
import { wrapText } from "@/utils/wrapText";
import {
  clinicalServerErrors,
  emptyClinicalDraft,
  setClinicalValue,
  toLamSang,
  validateClinicalDraft,
} from "@/utils/clinicalForm";
import { CLINICAL_FIELDS } from "@/constants/clinicalFields";
import { predictionOutcome } from "@/services/predictionService";
import type { Prediction } from "@/types/prediction";
import {
  clinicalRows,
  formatChance,
  mainChance,
  resultInsight,
  shortResult,
} from "@/utils/predictionDisplay";
import { sanitizeNumberInput } from "@/utils/clinicalForm";
import {
  needsProfileSetup,
  profileTieuSuDraft,
  profileWithTieuSu,
  tieuSuChanges,
} from "@/utils/tieuSu";
import type { User } from "@/types/user";

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
});

test("Vietnamese mobile numbers follow the backend rule", () => {
  for (const value of ["", "0912345678", "+84912345678", "84 912 345 678"])
    expect(validVnMobile(value), value).toBe(true);
  for (const value of ["0212345678", "091234567", "12345"])
    expect(validVnMobile(value), value).toBe(false);
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
  expect(clinicalServerErrors({ "lamSang.ho": "x", examDate: "y" })).toEqual({ ho: "x" });
  // No field for job level, province, blocks or B2/B10; codes never carry diacritics.
  const keys = CLINICAL_FIELDS.map((field) => field.key);
  for (const absent of ["tinh", "capbac", "b2", "b10"]) expect(keys).not.toContain(absent);
  for (const field of CLINICAL_FIELDS)
    for (const option of field.options ?? []) expect(option.code, field.key).toMatch(/^[ -~]+$/);
});

test("outcome follows the model's final conclusion", () => {
  const of = (status: string, ketLuanCuoi: boolean | null) =>
    predictionOutcome({ status, ketLuanCuoi } as unknown as Prediction);
  expect(of("FAILED", null)).toBe("FAILED");
  expect(of("SUCCESS", true)).toBe("Co");
  expect(of("SUCCESS", false)).toBe("Khong");
});

test("report wrapping preserves long notes and paragraph breaks", () => {
  const longWord = "ghi-chú-".repeat(80);
  const lines = wrapText(`Ghi chú\n\n${longWord}`, (text) => text.length * 9, 450);
  expect(lines[0]).toBe("Ghi chú");
  expect(lines[1]).toBe("");
  expect(lines.slice(2).join("")).toBe(longWord);
  expect(lines.every((line) => line.length <= 50)).toBe(true);
});

test("results use only three labels; the percentage appears only with an X-ray", () => {
  const base = {
    id: "p",
    user: null,
    examDate: "2026-01-01",
    lamSang: { ho: "Co", fvc: 85, gioitinh: "Nu" },
    image: null,
    status: "SUCCESS",
    modelName: "m",
    modelVersion: "1",
    errorCode: null,
    createdAt: "2026-01-01T00:00:00Z",
    pLamSang: 0.3,
    nguongLamSang: 0.2,
    baoNguyCoLamSang: true,
    coAnh: false,
    pAnh: null,
    pGhep: null,
    nguongGhep: null,
    baoNguyCoGhep: null,
    ketLuanCuoi: true,
    experimental: false,
    disclaimer: "",
  } as unknown as Prediction;
  expect(formatChance(0.163)).toBe("16%");
  expect(formatChance(0.004)).toBe("<1%");
  expect(mainChance(base)).toBeNull();
  expect(shortResult(base)).toBe("Có nguy cơ");
  expect(shortResult({ ...base, ketLuanCuoi: false })).toBe("Nguy cơ thấp");
  expect(shortResult({ ...base, status: "FAILED" })).toBe("Bị lỗi");
  const withImage = {
    ...base,
    coAnh: true,
    pAnh: 0.7,
    pGhep: 0.55,
    nguongGhep: 0.207,
    ketLuanCuoi: true,
  };
  expect(mainChance(withImage)).toBe(0.55);
  expect(shortResult(withImage)).toBe("Có nguy cơ · 55%");
  expect(mainChance({ ...withImage, status: "FAILED" })).toBeNull();
  // Values sent are shown with their Vietnamese labels, in form order.
  expect(clinicalRows(base)).toEqual([
    ["Giới tính", "Nữ"],
    ["Ho", "Có"],
    ["FVC % so với lý thuyết", "85 %"],
  ]);
});

test("comment and advice follow the image, the threshold and what was recorded", () => {
  const base = {
    status: "SUCCESS",
    coAnh: true,
    pGhep: 0.55,
    nguongGhep: 0.207,
    ketLuanCuoi: true,
    lamSang: { tuoinghe: 12, ho: "Co", khotho: "Co", hutthuoc: "Co hut thuoc" },
  } as unknown as Prediction;
  const atRisk = resultInsight(base)!;
  expect(atRisk.comment).toContain("55%");
  expect(atRisk.comment).toContain("cao hơn ngưỡng sàng lọc 21%");
  expect(atRisk.comment).toContain("tuổi nghề 12 năm, có ho và khó thở và đang hút thuốc");
  expect(atRisk.advice[0]).toContain("chuyên khoa hô hấp");
  expect(atRisk.advice.some((line) => line.startsWith("Ngừng hút thuốc"))).toBe(true);
  const clinicalLow = resultInsight({
    ...base,
    coAnh: false,
    ketLuanCuoi: false,
    lamSang: { ho: "Co" },
  } as Prediction)!;
  expect(clinicalLow.comment).toContain("chưa dựa trên phim X-quang");
  expect(clinicalLow.advice[0]).toContain("chụp X-quang ngực thẳng");
  expect(clinicalLow.advice.some((line) => line.includes("Bạn có ghi nhận ho"))).toBe(true);
  expect(clinicalLow.advice.some((line) => line.startsWith("Ngừng hút thuốc"))).toBe(false);
  expect(resultInsight({ ...base, status: "FAILED" } as Prediction)).toBeNull();
});

test("number fields only keep digits and one decimal separator; ranges are checked", () => {
  expect(sanitizeNumberInput("12a,5.3kg")).toBe("12,53");
  expect(sanitizeNumberInput(",5")).toBe("5");
  expect(sanitizeNumberInput("-3")).toBe("3");
  const errors = validateClinicalDraft({
    ...emptyClinicalDraft(),
    cao: "300",
    fvc: "85,5",
    tuoinghe: "71",
  });
  expect(errors).toEqual({
    cao: "Phải trong khoảng 100–220.",
    tuoinghe: "Phải trong khoảng 0–70.",
  });
});

test("tiểu sử: pre-filled from the profile, differences listed, saved with the codes of the form", () => {
  const user = {
    id: "u",
    code: "BN-000001",
    name: "Người Thử",
    email: "a@example.com",
    phone: "",
    role: "patient",
    active: true,
    birthDate: "1980-05-06",
    gender: "female",
    tieuSu: { cviec: "Thợ mài đá", tuoinghe: 12.5, hutthuoc: "Khong hut thuoc" },
  } as User;
  const draft = { ...emptyClinicalDraft(), ...profileTieuSuDraft(user) };
  expect(draft).toMatchObject({
    gioitinh: "Nu",
    namsinh: "1980",
    cviec: "Thợ mài đá",
    tuoinghe: "12,5",
  });
  expect(tieuSuChanges(user, draft)).toEqual([]);
  // Same number written differently is not a change; a new value and a cleared one are.
  let edited = setClinicalValue(draft, "tuoinghe", "12,50");
  edited = setClinicalValue(edited, "pxuong", "Nghiền sàng");
  edited = setClinicalValue(edited, "cviec", "");
  edited = setClinicalValue(edited, "fvc", "80"); // not tiểu sử
  edited = setClinicalValue(edited, "namsinh", "1999"); // never offered: comes from the birth date
  expect(tieuSuChanges(user, edited)).toEqual([
    { key: "cviec", label: "Công việc hiện tại", saved: "Thợ mài đá", current: "-" },
    { key: "pxuong", label: "Phân xưởng / bộ phận", saved: "-", current: "Nghiền sàng" },
  ]);
  expect(profileWithTieuSu(user, setClinicalValue(edited, "gioitinh", "Nam"))).toEqual({
    name: "Người Thử",
    email: "a@example.com",
    phone: "",
    birthDate: "1980-05-06",
    gender: "male",
    tieuSu: { pxuong: "Nghiền sàng", tuoinghe: 12.5, hutthuoc: "Khong hut thuoc" },
  });
  // A session object created before tiểu sử existed (e.g. kept across a hot reload) must not crash the form.
  const stale = { ...user, tieuSu: undefined } as unknown as User;
  expect(profileTieuSuDraft(stale)).toMatchObject({ gioitinh: "Nu", namsinh: "1980", cviec: "" });
  expect(tieuSuChanges(stale, draft).map((change) => change.key)).toContain("cviec");
  expect(needsProfileSetup(user)).toBe(false);
  expect(needsProfileSetup({ ...user, gender: "", birthDate: "", tieuSu: {} })).toBe(true);
  expect(needsProfileSetup({ ...user, role: "admin", gender: "", birthDate: "", tieuSu: {} })).toBe(
    false,
  );
});
