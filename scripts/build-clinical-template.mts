// Builds public/templates/mau-thong-tin-lam-sang.xlsx from the clinical field list.
// Run after changing src/constants/clinicalFields.ts:  npm run template:clinical
// The import (src/utils/clinicalImport.ts) only accepts files with exactly this layout.
import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLINICAL_GROUPS,
  CLINICAL_MAX_TEXT,
  TIEU_SU_GROUPS,
} from "../src/constants/clinicalFields.ts";
import {
  TEMPLATE_COLUMNS,
  TEMPLATE_MARKER,
  TEMPLATE_MARKER_LABEL,
  TEMPLATE_SHEET,
} from "../src/constants/clinicalTemplate.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "public/templates/mau-thong-tin-lam-sang.xlsx");

const TEAL = "FF087F77";
const TEAL_SOFT = "FFE6F4F1";
const INPUT_FILL = "FFFFFBEA";
const BORDER = { style: "thin" as const, color: { argb: "FFC9D6DC" } };
const box = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };

const workbook = new ExcelJS.Workbook();
workbook.creator = "SilicoCare";
const sheet = workbook.addWorksheet(TEMPLATE_SHEET, {
  views: [{ state: "frozen", ySplit: 5 }],
  properties: { defaultRowHeight: 20 },
});
const lists = workbook.addWorksheet("Danh_muc", { state: "veryHidden" });
const guide = workbook.addWorksheet("Hướng dẫn");

sheet.columns = [
  { width: 12 },
  { width: 26 },
  { width: 46 },
  { width: 11 },
  { width: 34 },
  { width: 40 },
];

sheet.mergeCells("A1:F1");
sheet.getCell("A1").value = "SilicoCare — Mẫu thông tin lâm sàng cho một lần khám";
sheet.getCell("A1").font = { bold: true, size: 15, color: { argb: TEAL } };
sheet.getRow(1).height = 28;

sheet.mergeCells("A2:F2");
sheet.getCell("A2").value =
  "Chỉ điền cột “Giá trị” (ô nền vàng). Ô để trống = chưa ghi nhận. Không đổi tên sheet, không sửa cột Mã trường, không thêm hoặc xoá dòng.";
sheet.getCell("A2").font = { italic: true, color: { argb: "FF44525C" } };
sheet.getCell("A2").alignment = { wrapText: true, vertical: "middle" };
sheet.getRow(2).height = 32;

sheet.getCell("A3").value = TEMPLATE_MARKER_LABEL;
sheet.getCell("B3").value = TEMPLATE_MARKER;
sheet.getRow(3).font = { size: 9, color: { argb: "FF5F6C77" } };

const header = sheet.getRow(5);
header.values = [...TEMPLATE_COLUMNS];
header.font = { bold: true, color: { argb: "FFFFFFFF" } };
header.height = 24;
header.eachCell((cell) => {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
  cell.alignment = { vertical: "middle" };
  cell.border = box;
});

let listColumn = 1;
let rowNumber = 6;
for (const group of CLINICAL_GROUPS) {
  const section = TIEU_SU_GROUPS.includes(group.title) ? "Tiểu sử" : "Lần khám này";
  sheet.mergeCells(rowNumber, 1, rowNumber, 6);
  const title = sheet.getCell(rowNumber, 1);
  title.value = `${section} · ${group.title}`;
  title.font = { bold: true, color: { argb: "FF0B4F4A" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_SOFT } };
  title.border = box;
  sheet.getRow(rowNumber).height = 22;
  rowNumber++;

  for (const field of group.fields) {
    const row = sheet.getRow(rowNumber);
    const parent = field.parent && group.fields.find((item) => item.key === field.parent!.key);
    const parentAnswer = parent?.options?.find(
      (option) => option.code === field.parent!.when,
    )?.label;
    row.values = [
      field.key,
      group.title,
      parent ? `   ↳ ${field.label} (khi “${parent.label}” = ${parentAnswer})` : field.label,
      field.unit ?? "",
      null,
      field.kind === "muc"
        ? "Chọn từ danh sách"
        : field.kind === "so"
          ? field.key === "namsinh"
            ? `Năm, từ ${field.min} đến ${field.max}`
            : `Số${field.min !== undefined ? `, từ ${String(field.min).replace(".", ",")} đến ${field.max}` : ""}; dấu thập phân “,” hoặc “.”`
          : `Chữ, tối đa ${CLINICAL_MAX_TEXT} ký tự${field.hint ? `. ${field.hint}` : ""}`,
    ];
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      cell.border = box;
      cell.alignment = { vertical: "middle", wrapText: column >= 3 };
      if (column <= 2) cell.font = { color: { argb: "FF5F6C77" } };
    });
    const valueCell = row.getCell(5);
    valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INPUT_FILL } };
    valueCell.protection = { locked: false };

    if (field.kind === "muc" && field.options) {
      const letter = lists.getColumn(listColumn).letter;
      field.options.forEach((option, index) => {
        lists.getCell(index + 1, listColumn).value = option.label;
      });
      valueCell.dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`Danh_muc!$${letter}$1:$${letter}$${field.options.length}`],
        showErrorMessage: true,
        errorTitle: "Giá trị không có trong danh sách",
        error: "Hãy chọn một giá trị trong danh sách hoặc để trống.",
      };
      listColumn++;
    } else if (field.kind === "so" && field.min !== undefined && field.max !== undefined) {
      valueCell.dataValidation = {
        type: "decimal",
        operator: "between",
        allowBlank: true,
        formulae: [field.min, field.max],
        showErrorMessage: true,
        errorTitle: "Số không hợp lệ",
        error: `Nhập một số từ ${field.min} đến ${field.max}.`,
      };
    } else if (field.kind === "chu") {
      valueCell.dataValidation = {
        type: "textLength",
        operator: "lessThanOrEqual",
        allowBlank: true,
        formulae: [CLINICAL_MAX_TEXT],
        showErrorMessage: true,
        errorTitle: "Quá dài",
        error: `Tối đa ${CLINICAL_MAX_TEXT} ký tự.`,
      };
    }
    rowNumber++;
  }
}

// Only the value column can be edited, so the layout the import checks stays intact.
await sheet.protect("", {
  selectLockedCells: true,
  selectUnlockedCells: true,
  formatColumns: true,
});

guide.columns = [{ width: 110 }];
[
  "HƯỚNG DẪN ĐIỀN MẪU THÔNG TIN LÂM SÀNG",
  "",
  "1. Mỗi file dùng cho MỘT lần khám. Điền ở sheet “Thông tin lâm sàng”, cột “Giá trị” (ô nền vàng).",
  "2. Không bắt buộc ô nào. Ô để trống được xem là chưa ghi nhận.",
  "3. Ô có danh sách: bấm vào ô và chọn giá trị. Ô số: chỉ nhập số, có thể dùng dấu phẩy thập phân (ví dụ 3,5).",
  "4. Câu hỏi có dấu ↳ chỉ cần điền khi câu hỏi chính phía trên có câu trả lời tương ứng (thường là “Có”).",
  "5. Nhóm “Tiểu sử” được điền sẵn từ hồ sơ trên hệ thống; giá trị trong file sẽ thay thế cho lần chẩn đoán này.",
  "6. Năm sinh luôn lấy theo ngày sinh trong hồ sơ nếu hồ sơ đã có ngày sinh.",
  "7. Không đổi tên sheet, không sửa cột “Mã trường”, không thêm hoặc xoá dòng: hệ thống chỉ nhận file đúng mẫu.",
  "8. File chỉ được đọc trên máy của bạn để điền form; nội dung file không được tải lên máy chủ.",
].forEach((text, index) => {
  const cell = guide.getCell(index + 1, 1);
  cell.value = text;
  cell.alignment = { wrapText: true };
  if (index === 0) cell.font = { bold: true, size: 14, color: { argb: TEAL } };
});

mkdirSync(dirname(out), { recursive: true });
await workbook.xlsx.writeFile(out);
console.log(`Wrote ${out} (${rowNumber - 6} rows)`);
