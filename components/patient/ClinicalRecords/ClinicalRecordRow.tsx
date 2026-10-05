import { Trash2 } from "lucide-react";
import type { ClinicalRecord } from "@/types/patient";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { today } from "@/utils/format";

export function ClinicalRecordRow({
  row,
  index,
  disabled,
  onUpdate,
  onRemove,
}: {
  row: ClinicalRecord;
  index: number;
  disabled: boolean;
  onUpdate: (key: keyof ClinicalRecord, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="timeline-row">
      <div className="timeline-row-grid">
        <Input
          label={`Mốc ${index + 1} · Ngày`}
          type="date"
          required
          max={today()}
          value={row.date}
          disabled={disabled}
          onChange={(event) => onUpdate("date", event.target.value)}
        />
        <Input
          label="Phơi nhiễm (năm)"
          type="number"
          min={0}
          max={80}
          step="0.1"
          required
          value={Number.isNaN(row.exposureYears) ? "" : row.exposureYears}
          disabled={disabled}
          onChange={(event) => onUpdate("exposureYears", event.target.value)}
        />
        <Input
          label="Bụi (mg/m³)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          required
          value={Number.isNaN(row.dustLevel) ? "" : row.dustLevel}
          disabled={disabled}
          onChange={(event) => onUpdate("dustLevel", event.target.value)}
        />
        <Input
          label="FVC (%)"
          type="number"
          min={0.1}
          max={150}
          step="0.1"
          required
          value={Number.isNaN(row.fvc) ? "" : row.fvc}
          disabled={disabled}
          onChange={(event) => onUpdate("fvc", event.target.value)}
        />
        <Input
          label="FEV1 (%)"
          type="number"
          min={0.1}
          max={150}
          step="0.1"
          required
          value={Number.isNaN(row.fev1) ? "" : row.fev1}
          disabled={disabled}
          onChange={(event) => onUpdate("fev1", event.target.value)}
        />
        <Button
          variant="ghost"
          aria-label={`Xóa mốc ${index + 1}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </div>
  );
}
