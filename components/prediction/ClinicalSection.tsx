"use client";
import type { ReactNode } from "react";
import { CLINICAL_MAX_TEXT } from "@/constants/clinicalFields";
import type { ClinicalField, ClinicalGroup } from "@/constants/clinicalFields";
import { isVisible, sanitizeNumberInput, setClinicalValue } from "@/utils/clinicalForm";
import type { ClinicalDraft } from "@/utils/clinicalForm";
import { FieldCell, FormSection } from "@/components/common/FormSection";
import { Dropdown } from "@/components/common/Dropdown";

export interface PlacedField {
  field: ClinicalField;
  /** Starts a new row of the grid. */
  rowStart: boolean;
}

/**
 * Fields of a group in display order. `all` keeps hidden follow-ups (summaries show every field). In groups with
 * `rowPerQuestion`, a main question whose follow-ups are shown starts a row and the next question starts another,
 * so each question sits on its own line with its follow-ups.
 */
export function placeFields(
  group: ClinicalGroup,
  draft: ClinicalDraft,
  all = false,
): PlacedField[] {
  const fields = all ? group.fields : group.fields.filter((field) => isVisible(field, draft));
  const opens = (field: ClinicalField) =>
    fields.some((other) => other.parent?.key === field.key && (all || isVisible(other, draft)));
  return fields.map((field, index) => {
    const previous = fields[index - 1];
    const rowStart =
      !!group.rowPerQuestion &&
      !field.parent &&
      index > 0 &&
      (opens(field) || !!previous?.parent || (previous && opens(previous)));
    return { field, rowStart: !!rowStart };
  });
}

export const fieldLabel = (field: ClinicalField) =>
  field.unit ? `${field.label} (${field.unit})` : field.label;

/**
 * One clinical group as a full-width form section. Number inputs only accept digits and one decimal separator;
 * choices show Vietnamese labels but hold the unaccented codes; follow-ups appear when their main answer triggers
 * them. `locked` fields are read-only with the reason as their note (e.g. birth year from the profile).
 */
export function ClinicalSection({
  group,
  title,
  value,
  onChange,
  errors,
  notes = {},
  locked = {},
  disabled,
  badge,
}: {
  group: ClinicalGroup;
  title?: string;
  value: ClinicalDraft;
  onChange: (value: ClinicalDraft) => void;
  errors: Record<string, string>;
  notes?: Record<string, string>;
  locked?: Record<string, string>;
  disabled?: boolean;
  badge?: ReactNode;
}) {
  const errorCount = group.fields.filter(
    (field) => isVisible(field, value) && errors[field.key],
  ).length;
  return (
    <FormSection
      title={title ?? group.title}
      description={group.description}
      badge={
        <>
          {badge}
          {errorCount > 0 && (
            <span className="group-badge group-badge--error">{errorCount} ô cần sửa</span>
          )}
        </>
      }
    >
      {placeFields(group, value).map(({ field, rowStart }) => {
        const id = `f-${field.key}`;
        const current = value[field.key] ?? "";
        const change = (next: string) => onChange(setClinicalValue(value, field.key, next));
        const error = errors[field.key];
        const lockReason = locked[field.key];
        const common = {
          id,
          disabled,
          "aria-invalid": !!error,
          "aria-describedby": `${id}-message`,
        };
        return (
          <FieldCell
            key={field.key}
            label={fieldLabel(field)}
            htmlFor={id}
            span={field.span}
            rowStart={rowStart}
            error={error}
            note={lockReason || notes[field.key]}
          >
            {field.kind === "muc" ? (
              <Dropdown
                id={id}
                value={current}
                disabled={disabled}
                invalid={!!error}
                describedBy={`${id}-message`}
                options={(field.options ?? []).map((option) => ({
                  value: option.code,
                  label: option.label,
                }))}
                onChange={change}
              />
            ) : (
              <input
                {...common}
                type="text"
                inputMode={field.kind === "so" ? "decimal" : undefined}
                maxLength={field.kind === "chu" ? CLINICAL_MAX_TEXT : 12}
                placeholder={field.placeholder}
                value={current}
                readOnly={!!lockReason}
                onChange={(event) =>
                  change(
                    field.kind === "so"
                      ? sanitizeNumberInput(event.target.value)
                      : event.target.value,
                  )
                }
              />
            )}
          </FieldCell>
        );
      })}
    </FormSection>
  );
}
