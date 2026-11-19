import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { CLINICAL_GROUP_BY_TITLE } from "@/constants/clinicalFields";
import { isVisible, parseClinicalNumber } from "@/utils/clinicalForm";
import type { ClinicalDraft } from "@/utils/clinicalForm";
import { formatClinicalValue } from "@/utils/predictionDisplay";
import { FormSection, ValueCell } from "@/components/common/FormSection";
import { fieldLabel, placeFields } from "@/components/prediction/ClinicalSection";

/** Text of one draft value for the confirmation step; "-" when empty or not applicable (hidden follow-up). */
export function summaryValue(key: string, draft: ClinicalDraft, groupTitle: string) {
  const field = CLINICAL_GROUP_BY_TITLE[groupTitle].fields.find((item) => item.key === key)!;
  const value = (draft[key] ?? "").trim();
  if (!value || !isVisible(field, draft)) return "-";
  if (field.kind === "so") {
    const number = parseClinicalNumber(value);
    return number === null ? value : formatClinicalValue({ ...field, unit: undefined }, number);
  }
  return formatClinicalValue(field, value);
}

/**
 * One group of the confirmation sheet: every field with the same grid placement as the form, "-" for the empty
 * ones. `before` adds cells in front (e.g. the visit date), `span` overrides every width (narrow column).
 */
export function ClinicalSheetSection({
  title,
  heading,
  draft,
  onEdit,
  before,
  span,
}: {
  title: string;
  heading?: string;
  draft: ClinicalDraft;
  onEdit?: () => void;
  before?: ReactNode;
  span?: number;
}) {
  const group = CLINICAL_GROUP_BY_TITLE[title];
  return (
    <FormSection
      className="sheet-section"
      title={heading ?? title}
      action={
        onEdit && (
          <button type="button" className="text-link" onClick={onEdit}>
            <Pencil size={14} />
            Sửa
          </button>
        )
      }
    >
      {before}
      {placeFields(group, draft, true).map(({ field, rowStart }) => (
        <ValueCell
          key={field.key}
          label={fieldLabel(field)}
          value={summaryValue(field.key, draft, title)}
          span={span ?? field.span}
          rowStart={span ? false : rowStart}
        />
      ))}
    </FormSection>
  );
}
