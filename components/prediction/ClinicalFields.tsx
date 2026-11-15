"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Input, Select } from "@/components/common/Input";
import { CLINICAL_GROUPS, CLINICAL_MAX_TEXT } from "@/constants/clinicalFields";
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CLINICAL_GROUPS.map((group) => [group.title, true])),
  );

  const visibleFields = (group: (typeof CLINICAL_GROUPS)[number]) =>
    group.fields.filter((item) => isVisible(item, value));

  const toggleGroup = (group: string) =>
    setOpenGroups((current) => ({ ...current, [group]: !current[group] }));

  return (
    <div className="clinical-form-screen">
      <div className="clinical-form-row clinical-form-row--primary">
        <div className="clinical-form-label">Ngày khám</div>
        <div className="clinical-form-control clinical-form-control--date">
          <Input
            label=""
            type="date"
            min="1900-01-01"
            max={today()}
            value={visitDate}
            onChange={(event) => onVisitDateChange(event.target.value)}
            error={errors.visitDate}
            disabled={disabled}
            className="clinical-input-field clinical-input-field--date"
          />
        </div>
      </div>

      {CLINICAL_GROUPS.map((group) => {
        const visible = visibleFields(group);
        if (!visible.length) return null;
        const isOpen = openGroups[group.title] ?? true;

        return (
          <div key={group.title} className="clinical-form-group">
            <button
              type="button"
              className="clinical-form-group__header"
              onClick={() => toggleGroup(group.title)}
            >
              <span>{group.title}</span>
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {isOpen && (
              <div className="clinical-form-group__body">
                {visible.map((item) => {
                  const label = item.unit ? `${item.label} (${item.unit})` : item.label;
                  const current = value[item.key] ?? "";
                  const change = (next: string) => onChange(setClinicalValue(value, item.key, next));
                  const className = item.parent ? "clinical-follow-up" : "clinical-main-field";

                  return (
                    <div key={item.key} className={`clinical-form-row ${className}`}>
                      <div className="clinical-form-label">{label}</div>
                      <div className="clinical-form-control">
                        {item.kind === "muc" ? (
                          <Select
                            label=""
                            value={current}
                            className="clinical-input-field"
                            onChange={(event) => change(event.target.value)}
                          >
                            <option value="">Không rõ / để trống</option>
                            {item.options?.map((option) => (
                              <option key={option.code} value={option.code}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            label=""
                            type="text"
                            inputMode={item.kind === "so" ? "decimal" : undefined}
                            maxLength={item.kind === "chu" ? CLINICAL_MAX_TEXT : 30}
                            value={current}
                            onChange={(event) => change(event.target.value)}
                            error={errors[item.key]}
                            className="clinical-input-field"
                          />
                        )}
                        {item.hint && <small className="clinical-form-hint">{item.hint}</small>}
                        {errors[item.key] && <p className="field-error">{errors[item.key]}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      <p className="notice">
        Số thập phân có thể ghi dấu phẩy (ví dụ 3,5). Câu hỏi phụ chỉ hiện khi câu chính trả lời
        “Có”.
      </p>
    </div>
  );
}
