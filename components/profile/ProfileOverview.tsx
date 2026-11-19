"use client";
import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Gender, User } from "@/types/user";
import { GENDER_LABELS, ROLE_LABELS } from "@/constants/app";
import { CLINICAL_GROUP_BY_TITLE } from "@/constants/clinicalFields";
import { authService } from "@/services/authService";
import { emptyClinicalDraft, validateClinicalDraft } from "@/utils/clinicalForm";
import type { ClinicalDraft } from "@/utils/clinicalForm";
import { profileTieuSuDraft, tieuSuFromDraft } from "@/utils/tieuSu";
import { errorMessage, formatDate, today } from "@/utils/format";
import { validPastDate, validVnMobile } from "@/utils/validation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { FieldCell, FormSection, ValueCell } from "@/components/common/FormSection";
import { Dropdown } from "@/components/common/Dropdown";
import { DatePicker } from "@/components/common/DatePicker";
import { useToast } from "@/components/common/Toast";
import { ClinicalSection } from "@/components/prediction/ClinicalSection";
import { ClinicalSheetSection } from "@/components/prediction/ClinicalSummary";

const TIEU_SU_SECTIONS: [string, string][] = [
  ["Nghề nghiệp & phơi nhiễm", "Thông tin nghề nghiệp"],
  ["Hút thuốc & tiền sử", "Thông tin tiền sử"],
];

interface Account {
  name: string;
  phone: string;
  gender: Gender | "";
  birthDate: string;
}

const accountOf = (user: User): Account => ({
  name: user.name,
  phone: user.phone,
  gender: user.gender,
  birthDate: user.birthDate,
});

const draftOf = (user: User): ClinicalDraft => ({
  ...emptyClinicalDraft(),
  ...profileTieuSuDraft(user),
});

/**
 * Personal profile: account details and (for a patient) the tiểu sử in one form. Read-only until "Chỉnh sửa";
 * the e-mail address and the patient code never change here.
 */
function ProfileEditor({ user }: { user: User }) {
  const toast = useToast();
  const patient = user.role === "patient";
  const [editing, setEditing] = useState(false);
  const [account, setAccount] = useState<Account>(() => accountOf(user));
  const [draft, setDraft] = useState<ClinicalDraft>(() => draftOf(user));
  const [busy, setBusy] = useState(false);

  const nameError =
    account.name.trim().length < 2 || account.name.trim().length > 150
      ? "Họ tên dài 2–150 ký tự."
      : undefined;
  const phoneError = !validVnMobile(account.phone)
    ? "Số di động Việt Nam không hợp lệ."
    : undefined;
  const birthError =
    account.birthDate && !validPastDate(account.birthDate) ? "Ngày sinh không hợp lệ." : undefined;
  const clinicalErrors = patient ? validateClinicalDraft(draft) : {};
  const invalid =
    !!nameError || !!phoneError || !!birthError || Object.keys(clinicalErrors).length > 0;

  function cancel() {
    setAccount(accountOf(user));
    setDraft(draftOf(user));
    setEditing(false);
  }

  async function save() {
    if (invalid) return;
    setBusy(true);
    try {
      await authService.updateProfile({
        name: account.name,
        email: user.email,
        phone: account.phone,
        birthDate: account.birthDate,
        gender: account.gender,
        ...(patient ? { tieuSu: tieuSuFromDraft(draft) } : {}),
      });
      toast({ tone: "success", message: "Đã cập nhật hồ sơ cá nhân." });
      setEditing(false);
    } catch (reason) {
      toast({ tone: "error", message: `Không thể cập nhật hồ sơ. ${errorMessage(reason)}` });
    } finally {
      setBusy(false);
    }
  }

  const set = (patch: Partial<Account>) => setAccount((current) => ({ ...current, ...patch }));
  const genderText = user.gender ? GENDER_LABELS[user.gender] : "-";

  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Thông tin tài khoản và tiểu sử được dùng để điền sẵn khi chẩn đoán"
        action={
          editing ? (
            <>
              <Button variant="secondary" disabled={busy} onClick={cancel}>
                <X size={16} />
                Hủy
              </Button>
              <Button busy={busy} disabled={invalid} onClick={save}>
                <Save size={16} />
                Lưu thay đổi
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Pencil size={16} />
              Chỉnh sửa
            </Button>
          )
        }
      />
      <Card className="profile-sheet">
        <form
          className="stack profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {editing ? (
            <FormSection title="Thông tin tài khoản">
              <FieldCell label="Họ và tên" htmlFor="pf-name" span={4} error={nameError} required>
                <input
                  id="pf-name"
                  value={account.name}
                  maxLength={150}
                  aria-invalid={!!nameError}
                  onChange={(event) => set({ name: event.target.value })}
                />
              </FieldCell>
              <FieldCell
                label="Email"
                htmlFor="pf-email"
                span={4}
                note="Email đăng nhập không thể thay đổi."
              >
                <input id="pf-email" value={user.email} readOnly />
              </FieldCell>
              <FieldCell label="Số điện thoại" htmlFor="pf-phone" span={4} error={phoneError}>
                <input
                  id="pf-phone"
                  type="tel"
                  placeholder="VD: 0912345678"
                  value={account.phone}
                  aria-invalid={!!phoneError}
                  onChange={(event) => set({ phone: event.target.value })}
                />
              </FieldCell>
              <FieldCell label="Giới tính" htmlFor="pf-gender" span={4}>
                <Dropdown
                  id="pf-gender"
                  value={account.gender}
                  options={Object.entries(GENDER_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  onChange={(value) => set({ gender: value as Gender | "" })}
                />
              </FieldCell>
              <FieldCell label="Ngày sinh" htmlFor="pf-birth" span={4} error={birthError}>
                <DatePicker
                  id="pf-birth"
                  value={account.birthDate}
                  min="1900-01-01"
                  max={today()}
                  invalid={!!birthError}
                  onChange={(value) => set({ birthDate: value })}
                />
              </FieldCell>
              {user.code && (
                <FieldCell label="Mã bệnh nhân" htmlFor="pf-code" span={4}>
                  <input id="pf-code" value={user.code} readOnly />
                </FieldCell>
              )}
            </FormSection>
          ) : (
            <FormSection title="Thông tin tài khoản">
              <ValueCell label="Họ và tên" value={user.name || "-"} span={4} />
              <ValueCell label="Email" value={user.email} span={4} />
              <ValueCell label="Số điện thoại" value={user.phone || "-"} span={4} />
              <ValueCell label="Giới tính" value={genderText} span={4} />
              <ValueCell
                label="Ngày sinh"
                value={user.birthDate ? formatDate(user.birthDate) : "-"}
                span={4}
              />
              <ValueCell
                label={user.code ? "Mã bệnh nhân" : "Vai trò"}
                value={user.code || ROLE_LABELS[user.role]}
                span={4}
              />
            </FormSection>
          )}

          {patient &&
            TIEU_SU_SECTIONS.map(([group, heading]) =>
              editing ? (
                <ClinicalSection
                  key={group}
                  group={CLINICAL_GROUP_BY_TITLE[group]}
                  title={heading}
                  value={draft}
                  onChange={setDraft}
                  errors={clinicalErrors}
                  disabled={busy}
                />
              ) : (
                <ClinicalSheetSection
                  key={group}
                  title={group}
                  heading={heading}
                  draft={draftOf(user)}
                />
              ),
            )}
        </form>
      </Card>
    </>
  );
}

export function ProfileOverview() {
  const { user } = useAuth();
  if (!user) return <Loading />;
  return <ProfileEditor key={`${user.id}:${user.name}:${user.birthDate}`} user={user} />;
}
