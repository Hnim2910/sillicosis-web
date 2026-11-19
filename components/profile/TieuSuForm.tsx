"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import type { Gender, User } from "@/types/user";
import { GENDER_LABELS } from "@/constants/app";
import { CLINICAL_GROUP_BY_TITLE } from "@/constants/clinicalFields";
import { authService } from "@/services/authService";
import { emptyClinicalDraft, validateClinicalDraft } from "@/utils/clinicalForm";
import type { ClinicalDraft } from "@/utils/clinicalForm";
import { profileTieuSuDraft, tieuSuFromDraft } from "@/utils/tieuSu";
import { cn, errorMessage, today } from "@/utils/format";
import { validPastDate } from "@/utils/validation";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { FieldCell, FormSection } from "@/components/common/FormSection";
import { DatePicker } from "@/components/common/DatePicker";
import { Dropdown } from "@/components/common/Dropdown";
import { ClinicalSection } from "@/components/prediction/ClinicalSection";

/**
 * Gender, birth date and the tiểu sử fields of the screening form, with the same checks as that form, in three
 * full-width sections. Used by the first sign-in drawer and the profile page; saving overwrites the whole profile
 * (PUT /api/users/me) with the account fields unchanged.
 */
export function TieuSuForm({
  user,
  onSaved,
  secondaryAction,
  submitLabel = "Lưu tiểu sử",
  stickyActions = false,
}: {
  user: User;
  onSaved?: (user: User) => void;
  /** E.g. "Để sau" in the first sign-in drawer. */
  secondaryAction?: ReactNode;
  submitLabel?: string;
  /** Keep the buttons pinned to the bottom of a scrolling dialog. */
  stickyActions?: boolean;
}) {
  const [gender, setGender] = useState<Gender | "">(user.gender);
  const [birthDate, setBirthDate] = useState(user.birthDate);
  const [draft, setDraft] = useState<ClinicalDraft>(() => ({
    ...emptyClinicalDraft(),
    ...profileTieuSuDraft(user),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const errors = validateClinicalDraft(draft);
  const birthError = birthDate && !validPastDate(birthDate) ? "Ngày sinh không hợp lệ." : undefined;
  const invalid = Object.keys(errors).length > 0 || !!birthError;

  async function save() {
    if (invalid) return;
    setBusy(true);
    setError("");
    try {
      const next = await authService.updateProfile({
        name: user.name,
        email: user.email,
        phone: user.phone,
        birthDate,
        gender,
        tieuSu: tieuSuFromDraft(draft),
      });
      setSaved(true);
      onSaved?.(next);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const changeDraft = (next: ClinicalDraft) => {
    setDraft(next);
    setSaved(false);
  };

  return (
    <form
      className="stack tieu-su-form"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      {error && <Alert>{error}</Alert>}
      {saved && !onSaved && <Alert tone="success">Đã lưu tiểu sử.</Alert>}
      <FormSection title="Thông tin cơ bản">
        <FieldCell label="Giới tính" htmlFor="ts-gender" span={6}>
          <Dropdown
            id="ts-gender"
            value={gender}
            disabled={busy}
            options={Object.entries(GENDER_LABELS).map(([key, label]) => ({ value: key, label }))}
            onChange={(next) => {
              setGender(next as Gender | "");
              setSaved(false);
            }}
          />
        </FieldCell>
        <FieldCell
          label="Ngày sinh"
          htmlFor="ts-birth"
          span={6}
          error={birthError}
          note="Năm sinh trong form chẩn đoán lấy theo ngày sinh này."
        >
          <DatePicker
            id="ts-birth"
            min="1900-01-01"
            max={today()}
            value={birthDate}
            disabled={busy}
            invalid={!!birthError}
            describedBy="ts-birth-message"
            onChange={(next) => {
              setBirthDate(next);
              setSaved(false);
            }}
          />
        </FieldCell>
      </FormSection>
      <ClinicalSection
        group={CLINICAL_GROUP_BY_TITLE["Nghề nghiệp & phơi nhiễm"]}
        title="Thông tin nghề nghiệp"
        value={draft}
        onChange={changeDraft}
        errors={errors}
        disabled={busy}
      />
      <ClinicalSection
        group={CLINICAL_GROUP_BY_TITLE["Hút thuốc & tiền sử"]}
        title="Thông tin tiền sử"
        value={draft}
        onChange={changeDraft}
        errors={errors}
        disabled={busy}
      />
      <div className={cn("form-actions-inline", stickyActions && "form-actions-sticky")}>
        {secondaryAction}
        <Button type="submit" busy={busy} disabled={invalid}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
