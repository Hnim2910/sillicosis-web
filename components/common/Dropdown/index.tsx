"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/format";

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * The system's dropdown (replaces the native <select>): a field-sized trigger and a list that opens under it.
 * The empty choice ("-- Chọn --") is the first item so a value can be cleared. Keyboard: ↑/↓ to move, Enter or
 * Space to choose, Esc or Tab to close; typing a letter jumps to the next matching option.
 */
export function Dropdown({
  id,
  value,
  options,
  onChange,
  placeholder = "-- Chọn --",
  disabled,
  invalid,
  describedBy,
  ariaLabel,
  className,
}: {
  id?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const listId = `${triggerId}-list`;
  const [open, setOpen] = useState(false);
  // Highlighted option: follows the mouse while it is over an option, and the arrow keys. -1 = none.
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const items: DropdownOption[] = [{ value: "", label: placeholder }, ...options];
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );

  function openList(byKeyboard = false) {
    if (disabled) return;
    setActive(byKeyboard ? selectedIndex : -1);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(items[index].value);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList(true);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(items.length - 1, (index < 0 ? selectedIndex : index) + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, (index < 0 ? selectedIndex : index) - 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active >= 0 ? active : selectedIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key.length === 1) {
      const letter = event.key.toLowerCase();
      const next = items.findIndex(
        (item, index) => index > active && item.label.toLowerCase().startsWith(letter),
      );
      if (next >= 0) setActive(next);
    }
  }

  return (
    <div ref={root} className={cn("dropdown", open && "is-open", className)}>
      <button
        id={triggerId}
        type="button"
        className={cn("dropdown__trigger", !selected && "is-placeholder")}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className="dropdown__value">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className="dropdown__caret" aria-hidden="true" />
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          className="dropdown__menu"
          aria-labelledby={triggerId}
        >
          {items.map((item, index) => (
            <li
              key={item.value || "__empty"}
              role="option"
              aria-selected={item.value === value}
              className={cn(
                "dropdown__option",
                index === active && "is-active",
                item.value === value && "is-selected",
                !item.value && "is-placeholder",
              )}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(-1)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
