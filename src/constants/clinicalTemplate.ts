// Layout of the clinical .xlsx template (public/templates/mau-thong-tin-lam-sang.xlsx, built by
// scripts/build-clinical-template.mts). The import accepts only files with exactly this layout.

export const TEMPLATE_URL = "/templates/mau-thong-tin-lam-sang.xlsx";
export const TEMPLATE_FILE_NAME = "mau-thong-tin-lam-sang.xlsx";
export const TEMPLATE_SHEET = "Thông tin lâm sàng";
export const TEMPLATE_MARKER_LABEL = "Mã mẫu";
/** Bump when the layout or the field list changes, so files filled in from an older template are refused. */
export const TEMPLATE_MARKER = "SILICOCARE-LAM-SANG-V1";
export const TEMPLATE_COLUMNS = [
  "Mã trường",
  "Nhóm",
  "Thông tin",
  "Đơn vị",
  "Giá trị",
  "Hướng dẫn",
] as const;
/** 0-based column indexes in a sheet row. */
export const KEY_COLUMN = 0;
export const VALUE_COLUMN = 4;
