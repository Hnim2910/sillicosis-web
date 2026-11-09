"use client";
import { Input, Select } from "@/components/common/Input";
import { CLINICAL_GROUPS, CLINICAL_MAX_TEXT } from "@/constants/clinicalFields";
import type { ClinicalField } from "@/constants/clinicalFields";
import { isVisible, setClinicalValue } from "@/utils/clinicalForm";
import type { ClinicalDraft } from "@/utils/clinicalForm";
import { today } from "@/utils/format";

/**
 * New Way clinical form: every field optional; choices show Vietnamese labels but hold the unaccented codes;
 * follow-up questions appear only when their main answer triggers them.
 */
export function ClinicalFields({
  visitDate,
  onVisitDateChange,
  value,
  onChange,
  errors,
  disabled,
}: {
  visitDate: string;
  onVisitDateChange: (value: string) => void;
  value: ClinicalDraft;
  onChange: (value: ClinicalDraft) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}) {
  const field = (item: ClinicalField) => {
    if (!isVisible(item, value)) return null;
    const label = item.unit ? `${item.label} (${item.unit})` : item.label;
    const current = value[item.key] ?? "";
    const change = (next: string) => onChange(setClinicalValue(value, item.key, next));
    const className = item.parent ? "clinical-follow-up" : undefined;
    if (item.kind === "muc")
      return (
        <div key={item.key} className={className}>
          <Select label={label} value={current} onChange={(event) => change(event.target.value)}>
            <option value="">Không rõ / để trống</option>
            {item.options?.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </Select>
          {errors[item.key] && <p className="field-error">{errors[item.key]}</p>}
        </div>
      );
    return (
      <div key={item.key} className={className}>
        <Input
          label={label}
          type="text"
          inputMode={item.kind === "so" ? "decimal" : undefined}
          maxLength={item.kind === "chu" ? CLINICAL_MAX_TEXT : 30}
          value={current}
          onChange={(event) => change(event.target.value)}
          error={errors[item.key]}
        />
        {item.hint && <small className="text-slate-500">{item.hint}</small>}
      </div>
    );
  };

  return (
    <div className="stack">
      <div className="form-grid">
        <Input
          label="Ngày khám"
          type="date"
          min="1900-01-01"
          max={today()}
          value={visitDate}
          onChange={(event) => onVisitDateChange(event.target.value)}
          error={errors.visitDate}
          disabled={disabled}
        />
      </div>
      {CLINICAL_GROUPS.map((group) => (
        <fieldset key={group.title} className="stack" disabled={disabled}>
          <legend className="font-semibold text-sm mb-2">{group.title}</legend>
          <div className="form-grid">{group.fields.map(field)}</div>
        </fieldset>
      ))}
      <p className="notice">
        Số thập phân có thể ghi dấu phẩy (ví dụ 3,5). Câu hỏi phụ chỉ hiện khi câu chính trả lời
        “Có”.
      </p>
    </div>
  );
}
