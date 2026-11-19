"use client";
import { Children, isValidElement, useId } from "react";
import type {
  ChangeEvent,
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/utils/format";
import { DatePicker } from "@/components/common/DatePicker";
import { Dropdown } from "@/components/common/Dropdown";
import type { DropdownOption } from "@/components/common/Dropdown";

/** Callers keep their `(event) => event.target.value` handlers when a custom control replaces a native one. */
function fakeEvent<T>(value: string) {
  return { target: { value }, currentTarget: { value } } as unknown as ChangeEvent<T>;
}

/** Text field with its label; `type="date"` renders the system date picker. */
export function Input({
  label,
  error,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={cn("field", className)}>
      <label htmlFor={inputId}>
        {label}
        {props.required && (
          <span aria-hidden="true" className="text-teal-700">
            {" "}
            *
          </span>
        )}
      </label>
      {props.type === "date" ? (
        <DatePicker
          id={inputId}
          value={String(props.value ?? "")}
          min={props.min !== undefined ? String(props.min) : undefined}
          max={props.max !== undefined ? String(props.max) : undefined}
          disabled={props.disabled}
          invalid={!!error}
          describedBy={errorId}
          onChange={(value) => props.onChange?.(fakeEvent<HTMLInputElement>(value))}
        />
      ) : (
        <input
          id={inputId}
          aria-label={label || undefined}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        />
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Labelled dropdown taking <option> children like a native select, rendered with the system dropdown. */
export function Select({
  label,
  children,
  id,
  className,
  error,
  value,
  onChange,
  disabled,
  required,
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const options: DropdownOption[] = Children.toArray(children)
    .filter((child): child is ReactElement<{ value?: string; children?: ReactNode }> =>
      isValidElement(child),
    )
    .map((child) => ({
      value: String(child.props.value ?? ""),
      label: String(child.props.children ?? ""),
    }));
  const empty = options.find((option) => option.value === "");
  return (
    <div className={cn("field", className)}>
      <label htmlFor={selectId}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <Dropdown
        id={selectId}
        value={String(value ?? "")}
        options={options.filter((option) => option.value !== "")}
        placeholder={empty?.label ?? "-- Chọn --"}
        disabled={disabled}
        invalid={!!error}
        describedBy={error ? `${selectId}-error` : undefined}
        onChange={(next) => onChange?.(fakeEvent<HTMLSelectElement>(next))}
      />
      {error && (
        <p id={`${selectId}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const generatedId = useId();
  return (
    <div className="field">
      <label htmlFor={id || generatedId}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <textarea id={id || generatedId} aria-label={label} rows={3} {...props} />
    </div>
  );
}
