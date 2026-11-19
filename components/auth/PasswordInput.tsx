"use client";
import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils/format";

/** Password field with its label and a show/hide button inside the input. */
export function PasswordInput({
  label,
  error,
  className,
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; error?: string }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);
  return (
    <div className={cn("field auth-password", className)}>
      <label htmlFor={inputId}>
        {label}
        {props.required && (
          <span aria-hidden="true" className="text-teal-700">
            {" "}
            *
          </span>
        )}
      </label>
      <div className="auth-password__box">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
