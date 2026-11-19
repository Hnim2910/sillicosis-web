import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import ExcelJS from "exceljs";
import { CLINICAL_FIELDS } from "@/constants/clinicalFields";
import { TEMPLATE_MARKER, TEMPLATE_SHEET } from "@/constants/clinicalTemplate";
import { setClinicalValue, toLamSang, validateClinicalDraft } from "@/utils/clinicalForm";
import { importClinicalValues, readClinicalFile, readTemplateRows } from "@/utils/clinicalImport";

// Works on the real template (public/templates); fake values only.

const TEMPLATE = resolve(__dirname, "../public/templates/mau-thong-tin-lam-sang.xlsx");

/** The template with some cells of the value column (E) filled in / some rows edited, as a browser File. */
async function filled(
  values: Record<string, string | number>,
  edit?: (sheet: ExcelJS.Worksheet, workbook: ExcelJS.Workbook) => void,
  name = "lan-kham.xlsx",
): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const source = readFileSync(TEMPLATE);
  await workbook.xlsx.load(
    source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength) as ArrayBuffer,
  );
  const sheet = workbook.getWorksheet(TEMPLATE_SHEET)!;
  sheet.eachRow((row) => {
    const key = String(row.getCell(1).value ?? "");
    if (key in values) row.getCell(5).value = values[key];
  });
  edit?.(sheet, workbook);
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], name);
}

test("the template has one row per clinical field, in form order, and imports as an empty form", async () => {
  const values = await readClinicalFile(await filled({}));
  expect(Object.keys(values)).toEqual(CLINICAL_FIELDS.map((field) => field.key));
  const result = importClinicalValues(values);
  expect(result.filled).toBe(0);
  expect(result.invalid).toEqual({});
});

test("values are read tolerantly: accents, case, yes/no spellings, units, decimal comma, partial labels", async () => {
  const result = importClinicalValues(
    await readClinicalFile(
      await filled({
        gioitinh: "nữ",
        namsinh: 1980,
        tuoinghe: "12 năm",
        ho: "x",
        tdho: "Ban đêm",
        hutthuoc: "có",
        slthuoc: "10",
        theluc: "Loại 2",
        cao: "165cm",
        fvc: "85,5",
        khotho: "CÓ",
        mdkhotho: "kho tho khi gang",
      }),
    ),
  );
  expect(result.invalid).toEqual({});
  expect(toLamSang(result.draft)).toEqual({
    gioitinh: "Nu",
    namsinh: 1980,
    tuoinghe: 12,
    ho: "Co",
    tdho: "Ban dem",
    hutthuoc: "Co hut thuoc",
    slthuoc: 10,
    theluc: "2",
    cao: 165,
    fvc: 85.5,
    khotho: "Co",
    mdkhotho: "Kho tho khi gang suc",
  });
  expect(validateClinicalDraft(result.draft)).toEqual({});
});

test("unreadable values are reported per field without repeating the value, and left empty", async () => {
  const result = importClinicalValues(
    await readClinicalFile(
      await filled({ cao: 320, khacdom: "thỉnh thoảng", mach: "70-80", ho: "Co" }),
    ),
  );
  expect(Object.keys(result.invalid).sort()).toEqual(["cao", "khacdom", "mach"]);
  expect(result.invalid.cao).toContain("100–220");
  expect(result.invalid.khacdom).not.toContain("thỉnh thoảng");
  expect(result.draft.cao).toBe("");
  expect(result.draft.ho).toBe("Co");
});

test("only the SilicoCare template is accepted", async () => {
  await expect(readClinicalFile(new File(["ho,Co"], "lan-kham.csv"))).rejects.toThrow(".xlsx");
  // Other spreadsheet / renamed sheet
  await expect(
    readClinicalFile(await filled({}, (sheet) => (sheet.name = "Sheet1"))),
  ).rejects.toThrow("không đúng mẫu");
  // Older template version
  await expect(
    readClinicalFile(
      await filled({}, (sheet) => (sheet.getCell("B3").value = "SILICOCARE-LAM-SANG-V0")),
    ),
  ).rejects.toThrow("phiên bản mẫu cũ");
  // A field row removed / two rows swapped / an unknown row added
  await expect(
    readClinicalFile(await filled({}, (sheet) => sheet.spliceRows(8, 1))),
  ).rejects.toThrow(/không đúng mẫu|thêm, xoá/);
  await expect(
    readClinicalFile(
      await filled({}, (sheet) => {
        sheet.getCell("A7").value = "namsinh";
        sheet.getCell("A8").value = "gioitinh";
      }),
    ),
  ).rejects.toThrow("đổi thứ tự");
  await expect(
    readClinicalFile(
      await filled({}, (sheet) =>
        sheet.insertRow(8, ["hoten", "Hành chính", "Họ tên", "", "A", ""]),
      ),
    ),
  ).rejects.toThrow("không đúng mẫu");
  // Changed header
  await expect(
    readClinicalFile(await filled({}, (sheet) => (sheet.getCell("E5").value = "Value"))),
  ).rejects.toThrow("không đúng mẫu");
  expect(TEMPLATE_MARKER).toMatch(/^SILICOCARE-LAM-SANG-V\d+$/);
});

test("follow-up with a value while its main question is 'Khong' is kept, reported and not sent", () => {
  const result = importClinicalValues({ ho: "Khong", tdho: "Ban dem", socansut: 4 });
  expect(result.orphans.sort()).toEqual(["socansut", "tdho"]);
  expect(result.draft.tdho).toBe("Ban dem");
  expect(toLamSang(result.draft)).toEqual({ ho: "Khong" });
  let draft = setClinicalValue(result.draft, "mach", "70");
  expect(draft.tdho).toBe("Ban dem");
  draft = setClinicalValue(draft, "ho", "Co");
  expect(toLamSang(draft).tdho).toBe("Ban dem");
  expect(setClinicalValue(draft, "ho", "Khong").tdho).toBe("");
});

test("readTemplateRows refuses a sheet without the marker", () => {
  expect(() =>
    readTemplateRows([["Mã trường", "Nhóm", "Thông tin", "Đơn vị", "Giá trị", "Hướng dẫn"]]),
  ).toThrow("không đúng mẫu");
});
