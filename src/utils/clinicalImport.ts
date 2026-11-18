import { CLINICAL_FIELD_BY_KEY, CLINICAL_FIELDS, CLINICAL_MAX_TEXT } from "@/constants/clinicalFields";
import type { ClinicalField } from "@/constants/clinicalFields";
import { emptyClinicalDraft, isVisible, parseClinicalNumber } from "@/utils/clinicalForm";
import type { ClinicalDraft } from "@/utils/clinicalForm";

// "Nhập từ file": fills the clinical form of ONE visit from a file read in the browser. Nothing is uploaded.
// Columns that are not one of the clinical field keys (name, phone, id, label…) are dropped while parsing and
// never stored, displayed or sent.

export const CLINICAL_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const CLINICAL_IMPORT_ACCEPT = ".json,.csv,.xlsx,.xls,.txt";

type Cell = unknown;

/** One record of the file, restricted to the clinical keys. `label` says where it is in the file (no content). */
export interface ImportedRow {
  label: string;
  values: Record<string, Cell>;
}

export interface ParsedClinicalFile {
  rows: ImportedRow[];
  /** Distinct columns that are not clinical fields; only their count is kept. */
  ignoredColumns: number;
}

export interface ClinicalImportResult {
  draft: ClinicalDraft;
  filled: number;
  /** Keys whose value could not be read; left empty. Values themselves are never reported (may be PII). */
  invalid: string[];
  /** Follow-up keys that have a value while their main question does not trigger them; value kept. */
  orphans: string[];
}

export class ClinicalImportError extends Error {}

/** Header → field key: case-insensitive, whitespace ignored. */
function fieldKey(header: string): string | null {
  const key = header.replace(/^﻿/, "").replace(/\s+/g, "").toLowerCase();
  return CLINICAL_FIELD_BY_KEY[key] ? key : null;
}

/** Keeps the clinical columns only (first non-empty value wins on duplicates) and counts the others. */
function restrict(records: { label: string; cells: [string, Cell][] }[]): ParsedClinicalFile {
  const ignored = new Set<string>();
  const rows: ImportedRow[] = [];
  for (const record of records) {
    const values: Record<string, Cell> = {};
    let any = false;
    for (const [header, cell] of record.cells) {
      if (!isBlank(cell)) any = true;
      const key = fieldKey(String(header));
      if (!key) {
        if (String(header).trim()) ignored.add(String(header).trim().toLowerCase());
        continue;
      }
      if (isBlank(values[key])) values[key] = cell;
    }
    if (any) rows.push({ label: record.label, values });
  }
  if (!rows.length) throw new ClinicalImportError("File không có dòng dữ liệu nào.");
  return { rows, ignoredColumns: ignored.size };
}

function isBlank(cell: Cell) {
  if (cell === null || cell === undefined) return true;
  if (typeof cell === "number") return Number.isNaN(cell);
  if (typeof cell === "string") return ["", "nan", "null", "none", "n/a"].includes(cell.trim().toLowerCase());
  return false;
}

// ---------- formats ----------

/** `{column: value}`, an array of them, or the API shape `{extra: {lam_sang: {...}}}` / `{lam_sang: {...}}`. */
export function parseJsonText(text: string): ParsedClinicalFile {
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    throw new ClinicalImportError("File JSON không đúng cú pháp.");
  }
  const unwrap = (item: unknown): unknown => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    const record = item as Record<string, unknown>;
    const extra = record.extra as Record<string, unknown> | undefined;
    return (
      record.lamSang || (extra && typeof extra === "object" && extra.lam_sang) || record.lam_sang || record
    );
  };
  const items = Array.isArray(data) ? data : [data];
  const records = items.map((item, index) => {
    const object = unwrap(item);
    if (!object || typeof object !== "object" || Array.isArray(object))
      throw new ClinicalImportError("JSON phải là một object {cột: giá trị} hoặc một mảng các object như vậy.");
    const cells = Object.entries(object as Record<string, unknown>).map(
      ([key, value]): [string, Cell] => [key, value !== null && typeof value === "object" ? "" : value],
    );
    return { label: items.length > 1 ? `Bản ghi thứ ${index + 1}` : "Bản ghi duy nhất", cells };
  });
  return restrict(records);
}

/** RFC 4180 CSV with "," ";" or tab, detected from the header line. */
export function parseCsvText(text: string): ParsedClinicalFile {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [",", ";", "\t"].reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best,
  );
  const table: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell === "") quoted = true;
    else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      table.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    table.push(row);
  }
  return fromTable(table);
}

/** Header row + data rows (CSV or spreadsheet). Row labels use the file's own line numbers (header = 1). */
function fromTable(table: Cell[][]): ParsedClinicalFile {
  const [header, ...body] = table;
  if (!header) throw new ClinicalImportError("File trống.");
  const headers = header.map((cell) => (cell === null || cell === undefined ? "" : String(cell)));
  return restrict(
    body.map((cells, index) => ({
      label: `Dòng ${index + 2} trong file`,
      cells: headers.map((name, column): [string, Cell] => [name, cells[column] ?? null]),
    })),
  );
}

/** One record; each line `column: value` or `column=value` (the first separator wins). `#` starts a comment. */
export function parseTxtText(text: string): ParsedClinicalFile {
  const cells: [string, Cell][] = [];
  for (const raw of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const at = line.search(/[:=]/);
    if (at <= 0) continue;
    cells.push([line.slice(0, at), line.slice(at + 1).trim()]);
  }
  return restrict([{ label: "Bản ghi duy nhất", cells }]);
}

/** First sheet of an .xlsx file. */
export async function parseXlsx(data: Blob | ArrayBuffer): Promise<ParsedClinicalFile> {
  const { readSheet } = await import("read-excel-file/universal");
  let table: Cell[][];
  try {
    table = await readSheet(data);
  } catch {
    throw new ClinicalImportError("Không đọc được file Excel. Hãy kiểm tra file hoặc lưu lại thành .xlsx/.csv.");
  }
  return fromTable(table);
}

/** Reads a user-chosen file in the browser. Throws ClinicalImportError with a Vietnamese message. */
export async function readClinicalFile(file: File): Promise<ParsedClinicalFile> {
  if (file.size > CLINICAL_IMPORT_MAX_BYTES)
    throw new ClinicalImportError("File lớn hơn 2 MB. Hãy chỉ để lại các dòng cần nhập.");
  const extension = file.name.toLowerCase().split(".").pop();
  switch (extension) {
    case "json":
      return parseJsonText(await file.text());
    case "csv":
      return parseCsvText(await file.text());
    case "txt":
      return parseTxtText(await file.text());
    case "xlsx":
      return parseXlsx(file);
    case "xls":
      throw new ClinicalImportError(
        "Chưa đọc được định dạng Excel cũ (.xls). Hãy mở file và lưu lại thành .xlsx hoặc .csv.",
      );
    default:
      throw new ClinicalImportError("Chỉ nhận file .json, .csv, .xlsx hoặc .txt.");
  }
}

// ---------- values ----------

/** Lower case, no diacritics, single spaces, no quotes: "Có hút thuốc" → "co hut thuoc". */
function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/["'“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Draft string for one cell, or null when it cannot be read for this field. */
function readValue(field: ClinicalField, cell: Cell): string | null {
  if (field.kind === "so") {
    if (typeof cell === "number") return Number.isFinite(cell) ? String(cell) : null;
    if (typeof cell !== "string") return null;
    const number = parseClinicalNumber(cell);
    return number === null ? null : String(number);
  }
  const text = cell instanceof Date ? null : String(cell).trim();
  if (text === null) return null;
  if (field.kind === "chu") return text.length > CLINICAL_MAX_TEXT ? null : text;
  const wanted = fold(text);
  const number = parseClinicalNumber(text);
  const option = field.options?.find(
    (item) =>
      fold(item.code) === wanted ||
      fold(item.label) === wanted ||
      (number !== null && parseClinicalNumber(item.code) === number),
  );
  return option ? option.code : null;
}

/** A fresh form (visit date is not part of it) filled from one imported row. */
export function importClinicalRow(row: ImportedRow): ClinicalImportResult {
  const draft = emptyClinicalDraft();
  const invalid: string[] = [];
  for (const field of CLINICAL_FIELDS) {
    const cell = row.values[field.key];
    if (isBlank(cell)) continue;
    const value = readValue(field, cell);
    if (value === null) invalid.push(field.key);
    else draft[field.key] = value;
  }
  const filled = Object.values(draft).filter((value) => value !== "").length;
  const orphans = CLINICAL_FIELDS.filter((field) => draft[field.key] && !isVisible(field, draft)).map(
    (field) => field.key,
  );
  return { draft, filled, invalid, orphans };
}

// ---------- template ----------

const EXAMPLE_NUMBERS: Record<string, string> = {
  namsinh: "1980",
  tuoinghe: "12",
  nampx: "5",
  tgian1: "3",
  tgian2: "2",
  cao: "165",
  can: "60",
  hatd: "120",
  hatt: "80",
  mach: "76",
  slthuoc: "10",
  tgdau: "2",
  socansut: "3",
  tgsut: "2",
  fvclt: "4,2",
  fvctt: "3,8",
  fev1lt: "3,5",
  fev1tt: "3,1",
  fvc: "90",
  fev1: "88",
  gaenler: "82",
};

/** Fake example value per field: main questions take their triggering answer so every follow-up applies. */
function exampleValue(field: ClinicalField): string {
  if (field.kind === "so") return EXAMPLE_NUMBERS[field.key] ?? "1";
  if (field.kind === "chu") return field.key === "cviec" ? "Công nhân nghiền đá (ví dụ)" : "Ví dụ";
  const trigger = CLINICAL_FIELDS.find((other) => other.parent?.key === field.key)?.parent?.when;
  const option = field.options?.find((item) => item.code === trigger) ?? field.options?.[0];
  return option?.label ?? "";
}

function csvCell(value: string) {
  return /[",;\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Sample CSV: every clinical key as a column and one row of fake values (UTF-8 BOM so Excel keeps diacritics). */
export function clinicalTemplateCsv() {
  const header = CLINICAL_FIELDS.map((field) => field.key).join(",");
  const example = CLINICAL_FIELDS.map((field) => csvCell(exampleValue(field))).join(",");
  return `﻿${header}\r\n${example}\r\n`;
}
