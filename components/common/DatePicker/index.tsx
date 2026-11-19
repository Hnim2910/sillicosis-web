"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, today } from "@/utils/format";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
/** Sent to the caller for a complete but impossible date (e.g. 31/02); never matches yyyy-mm-dd. */
export const INVALID_DATE = "invalid-date";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const display = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value.slice(8)}/${value.slice(5, 7)}/${value.slice(0, 4)}`
    : "";

/** "dd/mm/yyyy" → "yyyy-mm-dd", INVALID_DATE for an impossible day, null while incomplete. */
function parse(text: string): string | null {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
    ? iso(y, m - 1, d)
    : INVALID_DATE;
}

/** Digits only, slashes added as the user types: "06051980" → "06/05/1980". */
function mask(text: string) {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("/");
}

/**
 * The system's date field (replaces the native date input): typed as dd/mm/yyyy or picked from a calendar with
 * day, month and year views. `value`, `min` and `max` are yyyy-mm-dd; an empty field gives "".
 */
export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  disabled,
  invalid,
  describedBy,
  ariaLabel,
}: {
  id?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [text, setText] = useState(display(value));
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"day" | "month" | "year">("day");
  const initial = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : today();
  const [year, setYear] = useState(Number(initial.slice(0, 4)));
  const [month, setMonth] = useState(Number(initial.slice(5, 7)) - 1);
  const root = useRef<HTMLDivElement>(null);
  const [shownValue, setShownValue] = useState(value);

  // Value changed from outside (reset, import…): show it.
  if (value !== shownValue) {
    setShownValue(value);
    if (parse(text) !== value) setText(display(value));
  }

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function openCalendar() {
    if (disabled) return;
    const base = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : today();
    setYear(Number(base.slice(0, 4)));
    setMonth(Number(base.slice(5, 7)) - 1);
    setView("day");
    setOpen(true);
  }

  const outOfRange = (day: string) => (!!min && day < min) || (!!max && day > max);
  const yearOutOfRange = (y: number) =>
    (!!min && y < Number(min.slice(0, 4))) || (!!max && y > Number(max.slice(0, 4)));
  const monthOutOfRange = (y: number, m: number) =>
    outOfRange(iso(y, m, 1)) && outOfRange(iso(y, m, new Date(y, m + 1, 0).getDate()));

  function pick(day: string) {
    setText(display(day));
    onChange(day);
    setOpen(false);
  }

  function shiftMonth(step: number) {
    const next = new Date(year, month + step, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  // Monday-first grid of the shown month.
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  const todayIso = today();
  // Pages of 12 years aligned like 2021–2032, 2033–2044… (also before 2021).
  const decadeStart = 2021 + 12 * Math.floor((year - 2021) / 12);
  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  return (
    <div ref={root} className={cn("datepicker", open && "is-open")}>
      <div className={cn("datepicker__field", disabled && "is-disabled")}>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/yyyy"
          autoComplete="off"
          value={text}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          onChange={(event) => {
            const next = mask(event.target.value);
            setText(next);
            if (!next) onChange("");
            else {
              const parsed = parse(next);
              if (parsed) onChange(parsed);
            }
          }}
          onBlur={() => {
            if (text && !parse(text)) onChange(INVALID_DATE);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "ArrowDown" && event.altKey) openCalendar();
          }}
        />
        <button
          type="button"
          className="datepicker__toggle"
          aria-label="Mở lịch chọn ngày"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openCalendar())}
        >
          <CalendarDays size={17} />
        </button>
      </div>

      {open && (
        <div
          className="datepicker__panel"
          role="dialog"
          aria-label="Chọn ngày"
          onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        >
          <div className="datepicker__head">
            <button
              type="button"
              className="datepicker__nav"
              aria-label={
                view === "day" ? "Tháng trước" : view === "month" ? "Năm trước" : "12 năm trước"
              }
              onClick={() =>
                view === "day" ? shiftMonth(-1) : setYear(year - (view === "month" ? 1 : 12))
              }
            >
              <ChevronLeft size={18} />
            </button>
            <div className="datepicker__title">
              {view === "day" && (
                <>
                  <button type="button" onClick={() => setView("month")}>
                    Tháng {month + 1}
                    <ChevronDown size={14} />
                  </button>
                  <button type="button" onClick={() => setView("year")}>
                    {year}
                    <ChevronDown size={14} />
                  </button>
                </>
              )}
              {view === "month" && (
                <button type="button" onClick={() => setView("year")}>
                  {year}
                  <ChevronDown size={14} />
                </button>
              )}
              {view === "year" && (
                <span>
                  {years[0]} - {years[11]}
                </span>
              )}
            </div>
            <button
              type="button"
              className="datepicker__nav"
              aria-label={
                view === "day" ? "Tháng sau" : view === "month" ? "Năm sau" : "12 năm sau"
              }
              onClick={() =>
                view === "day" ? shiftMonth(1) : setYear(year + (view === "month" ? 1 : 12))
              }
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {view === "day" && (
            <div className="datepicker__days" role="grid">
              {WEEKDAYS.map((name) => (
                <span key={name} className="datepicker__weekday" role="columnheader">
                  {name}
                </span>
              ))}
              {cells.map((day, index) => {
                if (day === null) return <span key={`blank-${index}`} />;
                const date = iso(year, month, day);
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={outOfRange(date)}
                    aria-label={`${pad(day)}/${pad(month + 1)}/${year}`}
                    aria-pressed={date === value}
                    className={cn(
                      "datepicker__day",
                      date === todayIso && "is-today",
                      date === value && "is-selected",
                    )}
                    onClick={() => pick(date)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}

          {view === "month" && (
            <div className="datepicker__grid">
              {Array.from({ length: 12 }, (_, m) => (
                <button
                  key={m}
                  type="button"
                  disabled={monthOutOfRange(year, m)}
                  className={cn("datepicker__cell", m === month && "is-selected")}
                  onClick={() => {
                    setMonth(m);
                    setView("day");
                  }}
                >
                  Tháng {m + 1}
                </button>
              ))}
            </div>
          )}

          {view === "year" && (
            <div className="datepicker__grid">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  disabled={yearOutOfRange(y)}
                  className={cn("datepicker__cell", y === year && "is-selected")}
                  onClick={() => {
                    setYear(y);
                    setView("month");
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
