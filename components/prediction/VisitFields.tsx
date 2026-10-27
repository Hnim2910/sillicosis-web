"use client";
import type { VisitClinical } from "@/types/visit";
import { Input, Select } from "@/components/common/Input";
import { NUMBER_RULES } from "@/utils/visitForm";
import type { VisitDraft } from "@/utils/visitForm";
import { today } from "@/utils/format";

type Errors = Partial<Record<keyof VisitClinical, string>>;

const GROUPS: { title: string; keys: (keyof typeof NUMBER_RULES)[] }[] = [
  { title: "Nghề nghiệp & phơi nhiễm", keys: ["yearsInJob", "yearsExposed"] },
  {
    title: "Thể trạng & sinh hiệu",
    keys: ["heightCm", "weightKg", "systolicBp", "diastolicBp", "pulse"],
  },
  { title: "Chức năng hô hấp", keys: ["fvcL", "fev1L"] },
];

/** Clinical values of one visit. All optional except the date; they are stored, not sent to the model. */
export function VisitFields({
  value,
  onChange,
  errors,
  disabled,
}: {
  value: VisitDraft;
  onChange: (value: VisitDraft) => void;
  errors: Errors;
  disabled?: boolean;
}) {
  const set = (key: keyof VisitDraft) => (event: { target: { value: string } }) =>
    onChange({ ...value, [key]: event.target.value });
  const number = (key: keyof typeof NUMBER_RULES) => {
    const rule = NUMBER_RULES[key];
    return (
      <Input
        key={key}
        label={`${rule.label} (${rule.unit})`}
        type="number"
        inputMode="decimal"
        min={rule.min}
        max={rule.max}
        step={rule.step}
        value={value[key]}
        onChange={set(key)}
        error={errors[key]}
        disabled={disabled}
      />
    );
  };
  return (
    <div className="stack">
      <div className="form-grid">
        <Input
          label="Ngày khám"
          type="date"
          required
          min="1900-01-01"
          max={today()}
          value={value.visitDate}
          onChange={set("visitDate")}
          error={errors.visitDate}
          disabled={disabled}
        />
        <Input
          label="Ngành nghề"
          maxLength={100}
          value={value.industry}
          onChange={set("industry")}
          error={errors.industry}
          disabled={disabled}
        />
        <Input
          label="Tỉnh/thành làm việc"
          maxLength={50}
          value={value.province}
          onChange={set("province")}
          error={errors.province}
          disabled={disabled}
        />
      </div>
      {GROUPS.map((group) => (
        <fieldset key={group.title} className="stack" disabled={disabled}>
          <legend className="font-semibold text-sm mb-2">{group.title}</legend>
          <div className="form-grid">{group.keys.map(number)}</div>
        </fieldset>
      ))}
      <fieldset className="stack" disabled={disabled}>
        <legend className="font-semibold text-sm mb-2">Hút thuốc</legend>
        <div className="form-grid">
          <Select label="Có hút thuốc không" value={value.smoker} onChange={set("smoker")}>
            <option value="">Không rõ</option>
            <option value="yes">Có</option>
            <option value="no">Không</option>
          </Select>
          {value.smoker !== "no" && number("cigarettesPerDay")}
        </div>
      </fieldset>
    </div>
  );
}
