"use client";
import { CLINICAL_GROUP_BY_TITLE, TIEU_SU_GROUPS, VISIT_GROUPS } from "@/constants/clinicalFields";
import type { ClinicalDraft } from "@/utils/clinicalForm";
import { ClinicalSection } from "@/components/prediction/ClinicalSection";

/**
 * The whole clinical form: one full-width section per group, tiểu sử first (pre-filled from the profile), then the
 * values measured at this visit. Every field is optional.
 */
export function ClinicalFields({
  value,
  onChange,
  errors,
  notes,
  locked,
  disabled,
}: {
  value: ClinicalDraft;
  onChange: (value: ClinicalDraft) => void;
  errors: Record<string, string>;
  notes?: Record<string, string>;
  locked?: Record<string, string>;
  disabled?: boolean;
}) {
  const section = (title: string, fromProfile: boolean) => (
    <ClinicalSection
      key={title}
      group={CLINICAL_GROUP_BY_TITLE[title]}
      value={value}
      onChange={onChange}
      errors={errors}
      notes={notes}
      locked={locked}
      disabled={disabled}
      badge={fromProfile ? <span className="group-badge">Từ hồ sơ</span> : undefined}
    />
  );
  return (
    <div className="stack clinical-sections">
      <p className="clinical-section-label">Tiểu sử</p>
      {TIEU_SU_GROUPS.map((title) => section(title, true))}
      <p className="clinical-section-label">Lần khám này</p>
      {VISIT_GROUPS.map((title) => section(title, false))}
    </div>
  );
}
