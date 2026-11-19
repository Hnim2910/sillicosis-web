import {
  CLINICAL_FIELD_BY_KEY,
  CLINICAL_FIELDS,
  CLINICAL_MAX_TEXT,
} from "@/constants/clinicalFields";
import type { ClinicalField } from "@/constants/clinicalFields";
import {
  KEY_COLUMN,
  TEMPLATE_COLUMNS,
  TEMPLATE_MARKER,
  TEMPLATE_MARKER_LABEL,
  TEMPLATE_SHEET,
  VALUE_COLUMN,
} from "@/constants/clinicalTemplate";
import {
  emptyClinicalDraft,
  isVisible,
  parseClinicalNumber,
  rangeError,
} from "@/utils/clinicalForm";
import type { ClinicalDraft } from "@/utils/clinicalForm";

// "Nhập từ file": fills the clinical form of ONE screening from the SilicoCare .xlsx template, read in the browser.
// Nothing is uploaded. The layout is checked strictly (sheet, marker, header, every field row); the values are read
// tolerantly (accents, case, "có"/"x"/"yes", units after numbers, decimal comma…).

export const CLINICAL_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const CLINICAL_IMPORT_ACCEPT = ".xlsx";

type Cell = unknown;

export interface ClinicalImportResult {
  draft: ClinicalDraft;
  filled: number;
  /** Field key → why its value could not be used (the value itself is never repeated: it may be personal). */
  invalid: Record<string, string>;
  /** Follow-up keys that have a value while their main question does not trigger them; value kept. */
  orphans: string[];
}

/** The file is not the template (or not readable); the message says what to do. */
export class ClinicalImportError extends Error {}

const NOT_TEMPLATE =
  "Tệp không đúng mẫu của SilicoCare. Vui lòng tải tệp mẫu, điền vào cột “Giá trị” và thử lại.";

function isBlank(cell: Cell) {
  if (cell === null || cell === undefined) return true;
  if (typeof cell === "number") return Number.isNaN(cell);
  if (typeof cell === "string")
    return ["", "-", "nan", "null", "none", "n/a"].includes(cell.trim().toLowerCase());
  return false;
}

const text = (cell: Cell) => (cell === null || cell === undefined ? "" : String(cell).trim());

/**
 * Checks the template layout and returns field key → raw cell. Throws ClinicalImportError when the marker, the
 * header or the list of field rows differ from the template in any way.
 */
export function readTemplateRows(rows: Cell[][]): Record<string, Cell> {
  const markerRow = rows.find((row) => text(row[0]) === TEMPLATE_MARKER_LABEL);
  if (!markerRow) throw new ClinicalImportError(NOT_TEMPLATE);
  if (text(markerRow[1]) !== TEMPLATE_MARKER)
    throw new ClinicalImportError(
      "Tệp được tạo từ phiên bản mẫu cũ. Vui lòng tải tệp mẫu mới và nhập lại.",
    );
  const headerAt = rows.findIndex((row) => text(row[0]) === TEMPLATE_COLUMNS[0]);
  if (headerAt < 0 || TEMPLATE_COLUMNS.some((name, index) => text(rows[headerAt][index]) !== name))
    throw new ClinicalImportError(NOT_TEMPLATE);

  const values: Record<string, Cell> = {};
  const keys: string[] = [];
  for (const row of rows.slice(headerAt + 1)) {
    const key = text(row[KEY_COLUMN]);
    if (!key) continue;
    // Group title rows: one merged cell across the row, no group name in column B.
    if (!CLINICAL_FIELD_BY_KEY[key]) {
      if (row.slice(1).every((cell) => isBlank(cell))) continue;
      throw new ClinicalImportError(NOT_TEMPLATE);
    }
    keys.push(key);
    values[key] = row[VALUE_COLUMN];
  }
  const expected = CLINICAL_FIELDS.map((field) => field.key);
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index]))
    throw new ClinicalImportError(
      "Cấu trúc tệp mẫu đã bị thay đổi (thêm, xoá hoặc đổi thứ tự dòng). Vui lòng tải tệp mẫu mới và nhập lại.",
    );
  return values;
}

/** Reads a user-chosen file in the browser. Throws ClinicalImportError with a Vietnamese message. */
export async function readClinicalFile(file: File): Promise<Record<string, Cell>> {
  if (!/\.xlsx$/i.test(file.name))
    throw new ClinicalImportError(
      "Hệ thống chỉ hỗ trợ tệp Excel .xlsx được tạo từ tệp mẫu của SilicoCare.",
    );
  if (file.size > CLINICAL_IMPORT_MAX_BYTES)
    throw new ClinicalImportError("Tệp vượt quá dung lượng 2 MB cho phép của tệp mẫu.");
  const { readSheet } = await import("read-excel-file/universal");
  let rows: Cell[][];
  try {
    rows = await readSheet(file, TEMPLATE_SHEET);
  } catch {
    throw new ClinicalImportError(NOT_TEMPLATE);
  }
  return readTemplateRows(rows);
}

// ---------- values ----------

/** Lower case, no diacritics, single spaces, no quotes: "Có hút thuốc" → "co hut thuoc". */
export function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/["'“”‘’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const YES = new Set(["co", "c", "yes", "y", "x", "true", "dung"]);
const NO = new Set(["khong", "k", "ko", "no", "n", "false", "sai"]);

/** "12 năm", "165cm", "3,5 lít", "~80" → the leading number; null when there is none or more digits follow. */
function readNumber(cell: Cell): number | null {
  if (typeof cell === "number") return Number.isFinite(cell) ? cell : null;
  if (typeof cell !== "string") return null;
  const match = cell.trim().match(/^[~≈]?\s*(\d+(?:[.,]\d+)?)\s*([^\d]*)$/);
  return match ? parseClinicalNumber(match[1]) : null;
}

function readOption(field: ClinicalField, cell: Cell): string | null {
  const options = field.options ?? [];
  const wanted = fold(text(cell));
  if (!wanted) return null;
  const compact = wanted.replace(/\s/g, "");
  const number = parseClinicalNumber(wanted);
  const exact = options.find(
    (option) =>
      fold(option.code) === wanted ||
      fold(option.label).replace(/\s/g, "") === compact ||
      (number !== null && parseClinicalNumber(option.code) === number),
  );
  if (exact) return exact.code;
  // "Loại 2" for code "2".
  const digits = wanted.match(/(\d+)$/)?.[1];
  if (digits) {
    const byDigit = options.filter((option) => option.code === digits);
    if (byDigit.length === 1) return byDigit[0].code;
  }
  // Yes / no in any usual spelling, also for "Có hút thuốc" / "Không hút thuốc".
  const yesNo = YES.has(wanted) ? "co" : NO.has(wanted) ? "khong" : null;
  if (yesNo) {
    const matches = options.filter((option) => fold(option.code).split(" ")[0] === yesNo);
    if (matches.length === 1) return matches[0].code;
  }
  // A unique option starting with what was written ("kho tho khi gang" → "Kho tho khi gang suc").
  if (wanted.length >= 3) {
    const partial = options.filter((option) => fold(option.label).startsWith(wanted));
    if (partial.length === 1) return partial[0].code;
  }
  return null;
}

/** Draft string for one cell, or the reason it cannot be used for this field. */
function readValue(field: ClinicalField, cell: Cell): { value: string } | { error: string } {
  if (cell instanceof Date) return { error: "ô chứa ngày tháng." };
  if (field.kind === "so") {
    const number = readNumber(cell);
    if (number === null) return { error: "không đọc được số." };
    const outside = rangeError(field, number);
    return outside
      ? { error: outside.charAt(0).toLowerCase() + outside.slice(1) }
      : { value: String(number).replace(".", ",") };
  }
  if (field.kind === "chu") {
    const value = text(cell);
    return value.length > CLINICAL_MAX_TEXT
      ? { error: `dài quá ${CLINICAL_MAX_TEXT} ký tự.` }
      : { value };
  }
  const code = readOption(field, cell);
  return code ? { value: code } : { error: "không có trong danh sách lựa chọn." };
}

/** A fresh form (visit date is not part of it) filled from the template's value column. */
export function importClinicalValues(values: Record<string, Cell>): ClinicalImportResult {
  const draft = emptyClinicalDraft();
  const invalid: Record<string, string> = {};
  for (const field of CLINICAL_FIELDS) {
    const cell = values[field.key];
    if (isBlank(cell)) continue;
    const result = readValue(field, cell);
    if ("error" in result)
      invalid[field.key] =
        `Giá trị trong file chưa dùng được (${result.error.replace(/\.$/, "")}). Hãy nhập lại.`;
    else draft[field.key] = result.value;
  }
  const filled = Object.values(draft).filter((value) => value !== "").length;
  const orphans = CLINICAL_FIELDS.filter(
    (field) => draft[field.key] && !isVisible(field, draft),
  ).map((field) => field.key);
  return { draft, filled, invalid, orphans };
}
