import { Input, Select } from "@/components/common/Input";
import { OUTCOME_LABELS } from "@/constants/app";

export function HistoryFilters({
  query,
  label,
  from,
  to,
  onQuery,
  onLabel,
  onFrom,
  onTo,
}: {
  query: string;
  label: string;
  from: string;
  to: string;
  onQuery: (value: string) => void;
  onLabel: (value: string) => void;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  return (
    <div className="toolbar">
      <Input
        label="Tìm kiếm"
        placeholder="Tên hoặc mã bệnh nhân…"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
      />
      <Select label="Kết quả" value={label} onChange={(event) => onLabel(event.target.value)}>
        <option value="">Tất cả kết quả</option>
        {Object.entries(OUTCOME_LABELS).map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </Select>
      <Input
        label="Khám từ ngày"
        type="date"
        value={from}
        onChange={(event) => onFrom(event.target.value)}
      />
      <Input
        label="Đến ngày khám"
        type="date"
        value={to}
        onChange={(event) => onTo(event.target.value)}
      />
    </div>
  );
}
