"use client";
import { useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";

const LENGTH = 6;

/**
 * Six one-digit boxes like the code screens on phones: typing moves to the next box, Backspace goes back, the
 * arrow keys move, and pasting a code fills every box. `value` holds only digits.
 */
export function OtpInput({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");
  const focus = (index: number) => boxes.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();

  function setDigit(index: number, digit: string) {
    onChange((value.slice(0, index) + digit + value.slice(index + 1)).slice(0, LENGTH));
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      // Digits are always filled from the left, so Backspace removes the last one.
      event.preventDefault();
      if (!value) return;
      onChange(value.slice(0, -1));
      focus(value.length - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(index + 1);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    focus(pasted.length >= LENGTH ? LENGTH - 1 : pasted.length);
  }

  return (
    <div className="otp-boxes" role="group" aria-label="Mã xác nhận gồm 6 chữ số">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            boxes.current[index] = element;
          }}
          className="otp-box"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Chữ số thứ ${index + 1}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={digit}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            const typed = event.target.value.replace(/\D/g, "");
            if (!typed) return;
            if (typed.length > 1) {
              // Some keyboards put the whole code into one box.
              const next = (value.slice(0, index) + typed).slice(0, LENGTH);
              onChange(next);
              focus(next.length);
              return;
            }
            // Boxes fill from the left: a digit typed further right goes to the first empty box.
            const position = Math.min(index, value.length);
            setDigit(position, typed);
            focus(position + 1);
          }}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
        />
      ))}
    </div>
  );
}
