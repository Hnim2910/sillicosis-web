"use client";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { OUTCOME_LABELS } from "@/constants/app";
import { Dropdown } from "@/components/common/Dropdown";
import { DatePicker } from "@/components/common/DatePicker";

/** Filter bar above the table: risk label, visit date range and (admin lists) a patient search. */
export function HistoryFilters({
  showSearch,
  query,
  label,
  from,
  to,
  onQuery,
  onLabel,
  onFrom,
  onTo,
  onClear,
  dateError,
}: {
  showSearch: boolean;
  query: string;
  label: string;
  from: string;
  to: string;
  onQuery: (value: string) => void;
  onLabel: (value: string) => void;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
  onClear: () => void;
  dateError: boolean;
}) {
  const [text, setText] = useState(query);
  const active = !!label || !!from || !!to || !!query;
  return (
    <div className="filter-bar" role="search">
      <div className="filter-bar__item filter-bar__label">
        <Dropdown
          ariaLabel="Lọc theo nhãn rủi ro"
          value={label}
          placeholder="-- Chọn nhãn rủi ro --"
          options={Object.entries(OUTCOME_LABELS).map(([value, text]) => ({ value, label: text }))}
          onChange={onLabel}
        />
      </div>
      <div className="filter-bar__range" aria-label="Khoảng ngày khám">
        <span className="filter-bar__caption">Ngày khám</span>
        <div className="filter-bar__item filter-bar__date">
          <DatePicker ariaLabel="Ngày khám từ" value={from} invalid={dateError} onChange={onFrom} />
        </div>
        <span className="filter-bar__dash" aria-hidden="true">
          –
        </span>
        <div className="filter-bar__item filter-bar__date">
          <DatePicker ariaLabel="Ngày khám đến" value={to} invalid={dateError} onChange={onTo} />
        </div>
      </div>
      {showSearch && (
        <form
          className="filter-bar__search"
          onSubmit={(event) => {
            event.preventDefault();
            onQuery(text);
          }}
        >
          <input
            aria-label="Tìm theo tên hoặc mã bệnh nhân"
            placeholder="Tên hoặc mã bệnh nhân"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (!event.target.value) onQuery("");
            }}
          />
          <button type="submit" aria-label="Tìm kiếm">
            <Search size={17} />
          </button>
        </form>
      )}
      {active && (
        <button
          type="button"
          className="filter-bar__clear"
          onClick={() => {
            setText("");
            onClear();
          }}
        >
          <X size={15} />
          Xoá bộ lọc
        </button>
      )}
      {dateError && (
        <p className="filter-bar__error" role="alert">
          Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.
        </p>
      )}
    </div>
  );
}
