"use client";
import { useRef, useState } from "react";
import { Download, FileUp, Plus } from "lucide-react";
import type { ClinicalRecord } from "@/types/patient";
import { Button } from "@/components/common/Button";
import { ClinicalRecordRow } from "./ClinicalRecordRow";
import { Alert, EmptyState } from "@/components/common/Feedback";
import { Modal } from "@/components/common/Modal";
import { ClinicalTable } from "./ClinicalTable";
import { clinicalService } from "@/services/clinicalService";
import { errorMessage, today } from "@/utils/format";
import { validateClinicalRecords } from "@/utils/validation";

export function ClinicalRecords({
  value,
  onChange,
  disabled = false,
}: {
  value: ClinicalRecord[];
  onChange: (value: ClinicalRecord[]) => void;
  disabled?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [imported, setImported] = useState<ClinicalRecord[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const invalid = value.length ? validateClinicalRecords(value) : "";
  const update = (id: string, key: keyof ClinicalRecord, field: string) => {
    setSuccess("");
    onChange(
      value.map((row) =>
        row.id === id
          ? { ...row, [key]: key === "date" ? field : field === "" ? NaN : Number(field) }
          : row,
      ),
    );
  };
  return (
    <div className="clinical-editor">
      <div className="toolbar">
        <Button
          variant="secondary"
          disabled={disabled || value.length >= 100}
          onClick={() => {
            onChange([
              ...value,
              {
                id: crypto.randomUUID(),
                date: today(),
                exposureYears: NaN,
                dustLevel: NaN,
                fvc: NaN,
                fev1: NaN,
              },
            ]);
            setSuccess("");
          }}
        >
          <Plus size={15} />
          Thêm mốc
        </Button>
        <Button
          variant="secondary"
          busy={busy}
          disabled={disabled}
          onClick={() => fileInput.current?.click()}
        >
          <FileUp size={15} />
          Nhập Excel/CSV
        </Button>
        <a className="text-link" href="/templates/clinical-data.csv" download>
          <Download size={14} />
          Tải mẫu
        </a>
        <input
          ref={fileInput}
          className="sr-only"
          type="file"
          accept=".xlsx,.csv"
          aria-label="Chọn tệp dữ liệu lâm sàng"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setBusy(true);
            setError("");
            setSuccess("");
            try {
              setImported(await clinicalService.importFile(file));
            } catch (reason) {
              setError(errorMessage(reason));
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
      {invalid && <Alert>{invalid}</Alert>}
      {!value.length && (
        <EmptyState
          title="Chưa có mốc theo dõi"
          description="Thêm một mốc hoặc nhập dữ liệu từ tệp theo mẫu."
        />
      )}
      {value.map((row, index) => (
        <ClinicalRecordRow
          key={row.id}
          row={row}
          index={index}
          disabled={disabled}
          onUpdate={(key, field) => update(row.id, key, field)}
          onRemove={() => onChange(value.filter((entry) => entry.id !== row.id))}
        />
      ))}
      <p className="notice">
        Ngày theo dõi không trùng và không ở tương lai. Phạm vi nhập demo: phơi nhiễm 0–80 năm, bụi
        0–100 mg/m³, FVC/FEV1 lớn hơn 0 đến 150%.
      </p>
      <Modal open={!!imported} title="Kiểm tra dữ liệu nhập" onClose={() => setImported(null)}>
        <div className="stack">
          <Alert tone="info">
            {imported?.length} mốc hợp lệ. Xác nhận sẽ thay thế bảng đang nhập; dữ liệu chưa được
            lưu vào hồ sơ.
          </Alert>
          {imported && <ClinicalTable records={imported} />}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setImported(null)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (imported) onChange(imported);
                setImported(null);
                setSuccess("Đã điền dữ liệu từ tệp. Vui lòng lưu hoặc xác nhận trước khi dự đoán.");
              }}
            >
              Xác nhận dữ liệu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
