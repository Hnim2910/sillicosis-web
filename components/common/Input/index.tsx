import { useId } from "react";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/utils/format";

export function Input({
  label,
  error,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const generatedId = useId();
  const inputId = id || generatedId;
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
      <input
        id={inputId}
        aria-label={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function Select({
  label,
  children,
  id,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  const generatedId = useId();
  return (
    <div className={cn("field", className)}>
      <label htmlFor={id || generatedId}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <select id={id || generatedId} aria-label={label} {...props}>
        {children}
      </select>
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
