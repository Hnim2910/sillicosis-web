import { Input, Select } from "@/components/common/Input";

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
        placeholder="Tên bệnh nhân hoặc mã bản ghi…"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
      />
      <Select label="Kết quả" value={label} onChange={(event) => onLabel(event.target.value)}>
        <option value="">Tất cả kết quả</option>
        <option>Normal</option>
        <option>Silicosis</option>
      </Select>
      <Input
        label="Từ ngày"
        type="date"
        value={from}
        onChange={(event) => onFrom(event.target.value)}
      />
      <Input
        label="Đến ngày"
        type="date"
        value={to}
        onChange={(event) => onTo(event.target.value)}
      />
    </div>
  );
}
