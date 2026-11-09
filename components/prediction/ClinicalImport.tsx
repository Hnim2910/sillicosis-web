"use client";
import { useRef, useState } from "react";
import { Download, FileUp } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { CLINICAL_FIELD_BY_KEY } from "@/constants/clinicalFields";
import {
  CLINICAL_IMPORT_ACCEPT,
  ClinicalImportError,
  clinicalTemplateCsv,
  importClinicalRow,
  readClinicalFile,
} from "@/utils/clinicalImport";
import type { ClinicalImportResult, ParsedClinicalFile } from "@/utils/clinicalImport";

const labels = (keys: string[]) => keys.map((key) => CLINICAL_FIELD_BY_KEY[key]?.label ?? key).join(", ");

/**
 * "Nhập từ file": fills the clinical form of this visit from a .json/.csv/.xlsx/.txt file read in the browser
 * (nothing is uploaded). The user reviews the form and submits as usual. Only row numbers are shown, never the
 * file's other columns or the rejected values.
 */
export function ClinicalImport({
  onImport,
  disabled,
}: {
  onImport: (result: ClinicalImportResult) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedClinicalFile | null>(null);
  const [rowNumber, setRowNumber] = useState("1");
  const [summary, setSummary] = useState<{ result: ClinicalImportResult; row: string; ignored: number } | null>(
    null,
  );
  const [error, setError] = useState("");

  function apply(file: ParsedClinicalFile, index: number) {
    const row = file.rows[index];
    const result = importClinicalRow(row);
    onImport(result);
    setSummary({ result, row: row.label, ignored: file.ignoredColumns });
  }

  async function choose(file: File | undefined) {
    if (input.current) input.current.value = "";
    if (!file) return;
    setError("");
    setSummary(null);
    setParsed(null);
    try {
      const result = await readClinicalFile(file);
      if (result.rows.length === 1) apply(result, 0);
      else {
        setParsed(result);
        setRowNumber("1");
      }
    } catch (reason) {
      setError(reason instanceof ClinicalImportError ? reason.message : "Không đọc được file này.");
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([clinicalTemplateCsv()], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau_thong_tin_lam_sang.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const index = Number(rowNumber) - 1;
  const rowValid = !!parsed && Number.isInteger(index) && index >= 0 && index < parsed.rows.length;

  return (
    <div className="stack clinical-import">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          accept={CLINICAL_IMPORT_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => choose(event.target.files?.[0])}
        />
        <Button variant="secondary" disabled={disabled} onClick={() => input.current?.click()}>
          <FileUp size={16} />
          Nhập từ file
        </Button>
        <Button variant="ghost" disabled={disabled} onClick={downloadTemplate}>
          <Download size={16} />
          Tải file mẫu (.csv)
        </Button>
      </div>
      <p className="notice !mt-0">
        Nhận .json, .csv, .xlsx, .txt (tối đa 2 MB). File chỉ được đọc trên máy này, không tải lên máy chủ. Tên cột
        phải trùng tên trường trong file mẫu; các cột khác bị bỏ qua. Nhập file sẽ thay toàn bộ thông tin lâm sàng
        đang có; hãy xem lại trước khi gửi.
      </p>
      {error && <Alert>{error}</Alert>}
      {parsed && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="field">
            <span>{`File có ${parsed.rows.length} hàng dữ liệu. Chọn hàng số (1–${parsed.rows.length})`}</span>
            <input
              type="number"
              min={1}
              max={parsed.rows.length}
              value={rowNumber}
              onChange={(event) => setRowNumber(event.target.value)}
              disabled={disabled}
            />
          </label>
          <Button disabled={disabled || !rowValid} onClick={() => rowValid && apply(parsed, index)}>
            Điền hàng này
          </Button>
          {rowValid && <small className="text-slate-500">{parsed.rows[index].label}</small>}
        </div>
      )}
      {summary && (
        <Alert tone={summary.result.invalid.length || summary.result.orphans.length ? "info" : "success"}>
          <div className="stack !gap-1">
            <p>
              {`${summary.row}: đã điền ${summary.result.filled} ô; bỏ qua ${summary.ignored} cột không dùng; ${summary.result.invalid.length} giá trị không hợp lệ.`}
            </p>
            {summary.result.invalid.length > 0 && (
              <p>{`Ô có giá trị không hợp lệ (đã để trống, hãy nhập lại): ${labels(summary.result.invalid)}.`}</p>
            )}
            {summary.result.orphans.length > 0 && (
              <p>
                {`Câu phụ có giá trị nhưng câu chính để trống hoặc chưa chọn câu trả lời mở câu phụ (ví dụ “Có”): ${labels(summary.result.orphans)}. Giá trị vẫn được giữ, nhưng chỉ hiện và được gửi khi câu chính được chọn như vậy.`}
              </p>
            )}
          </div>
        </Alert>
      )}
    </div>
  );
}
