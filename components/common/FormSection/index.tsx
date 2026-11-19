import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/utils/format";

/**
 * A titled block of a form spanning the full width: grey title bar, then a 12-column grid of fields. Fields placed
 * on the same row always line up (label, input and message rows are shared through CSS subgrid).
 */
export function FormSection({
  title,
  description,
  badge,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("form-section", className)}>
      <header className="form-section__header">
        <div>
          <h3>
            {title}
            {badge}
          </h3>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      <div className="field-grid">{children}</div>
    </section>
  );
}

/** Grid placement: `span` of 12 columns; `rowStart` forces the field to begin a new row. */
export function gridPlacement(span = 4, rowStart = false): CSSProperties {
  return { gridColumn: rowStart ? `1 / span ${span}` : `span ${span}` };
}

/** Label on top, the control, then one 11px line for a note or an error (space kept so rows never jump). */
export function FieldCell({
  label,
  htmlFor,
  span,
  rowStart,
  error,
  note,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  span?: number;
  rowStart?: boolean;
  error?: string;
  note?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const messageId = htmlFor ? `${htmlFor}-message` : undefined;
  return (
    <div className="field-cell" style={gridPlacement(span, rowStart)}>
      <label htmlFor={htmlFor} className="field-cell__label">
        {label}
        {required && <span className="field-cell__required"> *</span>}
      </label>
      <div className="field-cell__control">{children}</div>
      <p
        id={messageId}
        className={cn("field-cell__message", error && "is-error")}
        role={error ? "alert" : undefined}
      >
        {error || note || ""}
      </p>
    </div>
  );
}

/** Read-only counterpart for summaries: label on top, the value below. */
export function ValueCell({
  label,
  value,
  span,
  rowStart,
}: {
  label: string;
  value: string;
  span?: number;
  rowStart?: boolean;
}) {
  return (
    <div className="value-cell" style={gridPlacement(span, rowStart)}>
      <span className="value-cell__label">{label}</span>
      <span className={cn("value-cell__value", value === "-" && "is-empty")}>{value}</span>
    </div>
  );
}
