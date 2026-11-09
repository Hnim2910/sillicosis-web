import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";
import { CLINICAL_FIELDS } from "@/constants/clinicalFields";
import { setClinicalValue, toLamSang, validateClinicalDraft } from "@/utils/clinicalForm";
import {
  clinicalTemplateCsv,
  importClinicalRow,
  parseCsvText,
  parseJsonText,
  parseTxtText,
  parseXlsx,
} from "@/utils/clinicalImport";

// Fake values only. "hoten", "sdt", "tinh", "id", "ketqua" stand for the extra columns real files carry.

test("JSON: object, array and API shape; labels with diacritics become codes; extra columns are dropped", () => {
  const one = parseJsonText(
    JSON.stringify({ hoten: "Nguyen Van A", sdt: "0900000000", " GioiTinh ": "Nữ", ho: "có", tdho: "Ban đêm", fvc: "3,5" }),
  );
  expect(one.rows).toHaveLength(1);
  expect(one.ignoredColumns).toBe(2);
  expect(Object.keys(one.rows[0].values)).not.toContain("hoten");
  const result = importClinicalRow(one.rows[0]);
  expect(toLamSang(result.draft)).toEqual({ gioitinh: "Nu", ho: "Co", tdho: "Ban dem", fvc: 3.5 });
  expect(result.filled).toBe(4);
  expect(result.invalid).toEqual([]);

  const many = parseJsonText(JSON.stringify([{ id: 1, cao: 160 }, { id: 2, cao: "abc", ketqua: 1 }]));
  expect(many.rows.map((row) => row.label)).toEqual(["Bản ghi thứ 1", "Bản ghi thứ 2"]);
  expect(many.ignoredColumns).toBe(2);
  expect(importClinicalRow(many.rows[1]).invalid).toEqual(["cao"]);
  expect(importClinicalRow(many.rows[1]).draft.cao).toBe("");

  const api = parseJsonText(JSON.stringify({ extra: { lam_sang: { mach: 80 } } }));
  expect(importClinicalRow(api.rows[0]).draft.mach).toBe("80");
  expect(() => parseJsonText("{oops")).toThrow("JSON");
});

test("CSV: header row, quoted cells, ';' delimiter, decimal comma, NaN and several rows", () => {
  const csv =
    "﻿hoten;tinh;MDKHOTHO;khotho;fev1;theluc;cviec\r\n" +
    'A;X;"Kho tho thuong xuyen, ca khi nghi ngoi";Có;"3,1";2;"công nhân ""đá"""\r\n' +
    "B;Y;nan;KHONG;NaN;Loại 3;\r\n" +
    ";;;;;;\r\n";
  const file = parseCsvText(csv);
  expect(file.rows).toHaveLength(2); // the all-empty line is skipped
  expect(file.rows.map((row) => row.label)).toEqual(["Dòng 2 trong file", "Dòng 3 trong file"]);
  expect(file.ignoredColumns).toBe(2);
  const first = importClinicalRow(file.rows[0]);
  expect(toLamSang(first.draft)).toEqual({
    mdkhotho: "Kho tho thuong xuyen, ca khi nghi ngoi",
    khotho: "Co",
    fev1: 3.1,
    theluc: "2",
    cviec: 'công nhân "đá"',
  });
  const second = importClinicalRow(file.rows[1]);
  expect(toLamSang(second.draft)).toEqual({ khotho: "Khong", theluc: "3" });
  expect(second.invalid).toEqual([]);
});

test("TXT: 'column: value' and 'column=value'; invalid choices are reported by field, not by value", () => {
  const file = parseTxtText("# phiếu khám giả\nhoten: Tran B\nho: Co\ntdho = ban ngay\ngioitinh: khac\nnamsinh=1975\n");
  expect(file.ignoredColumns).toBe(1);
  const result = importClinicalRow(file.rows[0]);
  expect(toLamSang(result.draft)).toEqual({ ho: "Co", tdho: "Ban ngay", namsinh: 1975 });
  expect(result.invalid).toEqual(["gioitinh"]);
});

test("follow-up with a value while its main question is empty or 'Khong' is kept and reported", () => {
  const result = importClinicalRow(parseTxtText("ho: Khong\ntdho: Ban dem\nsocansut: 4").rows[0]);
  expect(result.orphans.sort()).toEqual(["socansut", "tdho"]);
  expect(result.draft.tdho).toBe("Ban dem");
  expect(toLamSang(result.draft)).toEqual({ ho: "Khong" }); // hidden values are never sent
  // Editing another field keeps them; choosing "Co" for the main question shows and sends them.
  let draft = setClinicalValue(result.draft, "mach", "70");
  expect(draft.tdho).toBe("Ban dem");
  draft = setClinicalValue(draft, "ho", "Co");
  expect(toLamSang(draft).tdho).toBe("Ban dem");
  // Moving the main question away from "Co" again clears its follow-ups.
  expect(setClinicalValue(draft, "ho", "Khong").tdho).toBe("");
});

/** Minimal .xlsx (shared strings for text, plain numbers otherwise). */
function fakeXlsx(rows: (string | number | null)[][]): ArrayBuffer {
  const strings: string[] = [];
  const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const col = (index: number) => String.fromCharCode(65 + index);
  const sheetRows = rows
    .map((row, r) => {
      const cells = row
        .map((value, c) => {
          const ref = `${col(c)}${r + 1}`;
          if (value === null) return "";
          if (typeof value === "number") return `<c r="${ref}"><v>${value}</v></c>`;
          strings.push(value);
          return `<c r="${ref}" t="s"><v>${strings.length - 1}</v></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  const main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const pkg = "http://schemas.openxmlformats.org/package/2006/relationships";
  const zip = zipSync({
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>`,
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${pkg}"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${main}" xmlns:r="${rel}"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="${pkg}">` +
        `<Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="${rel}/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    ),
    "xl/worksheets/sheet1.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${main}"><sheetData>${sheetRows}</sheetData></worksheet>`,
    ),
    "xl/sharedStrings.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><sst xmlns="${main}" count="${strings.length}" uniqueCount="${strings.length}">` +
        strings.map((text) => `<si><t>${esc(text)}</t></si>`).join("") +
        `</sst>`,
    ),
  });
  return zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer;
}

test("XLSX: first sheet, header row, numbers and text cells, several rows", async () => {
  const file = await parseXlsx(
    fakeXlsx([
      ["id", "hoten", "Ho", "hatd", "fvc", "hutthuoc", "slthuoc"],
      [1, "A", "Có", 130, "3,4", "có hút thuốc", 5],
      [2, "B", "Khong", null, 2.9, "Khong hut thuoc", null],
    ]),
  );
  expect(file.rows).toHaveLength(2);
  expect(file.ignoredColumns).toBe(2);
  expect(toLamSang(importClinicalRow(file.rows[0]).draft)).toEqual({
    ho: "Co",
    hatd: 130,
    fvc: 3.4,
    hutthuoc: "Co hut thuoc",
    slthuoc: 5,
  });
  expect(toLamSang(importClinicalRow(file.rows[1]).draft)).toEqual({
    ho: "Khong",
    fvc: 2.9,
    hutthuoc: "Khong hut thuoc",
  });
});

test("template: every clinical field as a column, one fake row that imports without errors", () => {
  const csv = clinicalTemplateCsv();
  const header = csv.replace(/^﻿/, "").split("\r\n")[0].split(",");
  expect(header).toEqual(CLINICAL_FIELDS.map((field) => field.key));
  expect(header).toHaveLength(63);
  const file = parseCsvText(csv);
  expect(file.ignoredColumns).toBe(0);
  const result = importClinicalRow(file.rows[0]);
  expect(result.invalid).toEqual([]);
  expect(result.orphans).toEqual([]);
  expect(result.filled).toBe(CLINICAL_FIELDS.length);
  expect(validateClinicalDraft(result.draft)).toEqual({});
});
