import type { ClinicalRecord } from "@/types/patient";
import { CLINICAL_COLUMNS } from "@/constants/app";
import { validateClinicalRecords } from "@/utils/validation";

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];
    if (character === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
      if (character === "\r" && text[i + 1] === "\n") i += 1;
    } else value += character;
  }
  if (quoted) throw new Error("Tệp CSV có dấu ngoặc kép chưa đóng.");
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

export function clinicalRowsToRecords(rows: unknown[][]): ClinicalRecord[] {
  if (rows.length < 2) throw new Error("Tệp rỗng hoặc chưa có dữ liệu theo dõi.");
  const headers = rows[0].map((cell) =>
    String(cell ?? "")
      .replace(/^\uFEFF/, "")
      .trim(),
  );
  if (
    headers.length !== CLINICAL_COLUMNS.length ||
    !CLINICAL_COLUMNS.every((column) => headers.includes(column))
  )
    throw new Error(`Sai cấu trúc cột. Cần: ${CLINICAL_COLUMNS.join(", ")}.`);
  const records = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell !== null && cell !== ""))
    .map((row) => {
      const get = (column: (typeof CLINICAL_COLUMNS)[number]) => row[headers.indexOf(column)];
      const number = (column: (typeof CLINICAL_COLUMNS)[number]) => {
        const value = get(column);
        return (typeof value !== "number" && typeof value !== "string") ||
          String(value).trim() === ""
          ? NaN
          : Number(value);
      };
      const dateValue = get("date");
      return {
        id: crypto.randomUUID(),
        date:
          dateValue instanceof Date
            ? dateValue.toISOString().slice(0, 10)
            : String(dateValue ?? "").trim(),
        exposureYears: number("exposureYears"),
        dustLevel: number("dustLevel"),
        fvc: number("fvc"),
        fev1: number("fev1"),
      };
    });
  const error = validateClinicalRecords(records);
  if (error) throw new Error(error);
  return records.sort((a, b) => a.date.localeCompare(b.date));
}

export const clinicalService = {
  async importFile(file: File) {
    if (file.size > 5 * 1024 * 1024) throw new Error("Vui lòng chọn tệp dữ liệu nhỏ hơn 5 MB.");
    if (/\.csv$/i.test(file.name)) return clinicalRowsToRecords(parseCsv(await file.text()));
    if (/\.xlsx$/i.test(file.name)) {
      try {
        const { readSheet } = await import("read-excel-file/browser");
        return clinicalRowsToRecords(await readSheet(file));
      } catch (error) {
        if (error instanceof Error && /cột|Dòng|Tệp rỗng|mốc/.test(error.message)) throw error;
        throw new Error(
          "Không đọc được tệp Excel. Hãy dùng .xlsx đúng mẫu, không có mật khẩu bảo vệ.",
        );
      }
    }
    throw new Error("Chỉ hỗ trợ tệp .xlsx hoặc .csv theo mẫu.");
  },
};
