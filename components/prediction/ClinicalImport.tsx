"use client";
import { useRef, useState } from "react";
import { Download, FileUp } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { CLINICAL_FIELD_BY_KEY } from "@/constants/clinicalFields";
import { TEMPLATE_FILE_NAME, TEMPLATE_URL } from "@/constants/clinicalTemplate";
import {
  CLINICAL_IMPORT_ACCEPT,
  ClinicalImportError,
  importClinicalValues,
  readClinicalFile,
} from "@/utils/clinicalImport";
import type { ClinicalImportResult } from "@/utils/clinicalImport";

const labels = (keys: string[]) =>
  keys.map((key) => CLINICAL_FIELD_BY_KEY[key]?.label ?? key).join(", ");

/**
 * "Nhập từ file" and "Tải file mẫu": the file is read in the browser only (nothing is uploaded) and must be the
 * SilicoCare .xlsx template; anything else is refused with a toast and the form is left untouched.
 */
export function ClinicalImport({
  onImport,
  disabled,
}: {
  onImport: (result: ClinicalImportResult) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const toast = useToast();

  async function choose(file: File | undefined) {
    if (input.current) input.current.value = "";
    if (!file) return;
    setReading(true);
    try {
      const result = importClinicalValues(await readClinicalFile(file));
      onImport(result);
      const invalid = Object.keys(result.invalid).length;
      const parts = [
        invalid
          ? `Đã điền ${result.filled} trường từ tệp "${file.name}". ${invalid} trường có giá trị không hợp lệ đã được đánh dấu đỏ, vui lòng kiểm tra và nhập lại.`
          : `Đã nhập dữ liệu từ tệp "${file.name}": ${result.filled} trường thông tin được điền vào biểu mẫu.`,
        result.orphans.length
          ? `Các câu hỏi phụ chưa áp dụng do câu hỏi chính chưa phù hợp: ${labels(result.orphans)}.`
          : "",
      ];
      toast({
        tone: invalid || result.orphans.length ? "warning" : "success",
        message: parts.filter(Boolean).join(" "),
      });
    } catch (reason) {
      toast({
        tone: "error",
        message:
          reason instanceof ClinicalImportError
            ? `Nhập dữ liệu thất bại. ${reason.message}`
            : "Nhập dữ liệu thất bại. Không thể đọc tệp đã chọn, vui lòng kiểm tra lại tệp.",
      });
    } finally {
      setReading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={input}
        type="file"
        accept={CLINICAL_IMPORT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => choose(event.target.files?.[0])}
      />
      <Button
        variant="primary"
        busy={reading}
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        <FileUp size={16} />
        Nhập từ file (.xlsx)
      </Button>
      <a
        className={`btn btn-secondary${disabled ? " pointer-events-none opacity-60" : ""}`}
        href={TEMPLATE_URL}
        download={TEMPLATE_FILE_NAME}
      >
        <Download size={16} />
        Tải file mẫu
      </a>
    </div>
  );
}
