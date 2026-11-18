"use client";
import { useState } from "react";
import type { ProfileInput, User } from "@/types/user";
import { GENDER_LABELS } from "@/constants/app";
import { authService } from "@/services/authService";
import { Input, Select, Textarea } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { errorMessage, today } from "@/utils/format";
import { PROFILE_MAX_TEXT, validEmail, validPastDate, validVnMobile } from "@/utils/validation";

/** Account and patient record in one form (a patient account is the patient record). */
export function ProfileForm({ user }: { user: User }) {
  const patient = user.role === "patient";
  const [form, setForm] = useState<ProfileInput>({
    name: user.name,
    email: user.email,
    phone: user.phone,
    birthDate: user.birthDate,
    gender: user.gender,
    occupation: user.occupation,
    workplace: user.workplace,
    exposureHistory: user.exposureHistory,
    riskFactors: user.riskFactors,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const change =
    (key: keyof ProfileInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm({ ...form, [key]: event.target.value });
      setSuccess(false);
    };
  const tooLong = (value: string) => value.length > PROFILE_MAX_TEXT;
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
          await authService.updateProfile(form);
          setSuccess(true);
        } catch (reason) {
          setError(errorMessage(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">Đã lưu hồ sơ.</Alert>}
      <Input label="Họ và tên" required value={form.name} onChange={change("name")} />
      <div className="form-grid">
        <Input label="Email" type="email" required value={form.email} onChange={change("email")} />
        <Input
          label="Số điện thoại"
          type="tel"
          value={form.phone}
          onChange={change("phone")}
          error={!validVnMobile(form.phone) ? "Số di động Việt Nam không hợp lệ." : undefined}
        />
        <Input
          label="Ngày sinh"
          type="date"
          min="1900-01-01"
          max={today()}
          value={form.birthDate}
          onChange={change("birthDate")}
          error={
            form.birthDate && !validPastDate(form.birthDate) ? "Ngày sinh không hợp lệ." : undefined
          }
        />
        <Select label="Giới tính" value={form.gender} onChange={change("gender")}>
          <option value="">Chưa cập nhật</option>
          {Object.entries(GENDER_LABELS).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </Select>
        <Input label="Nghề nghiệp" value={form.occupation} onChange={change("occupation")} />
        {patient && (
          <Input label="Nơi làm việc" value={form.workplace} onChange={change("workplace")} />
        )}
      </div>
      {patient && (
        <>
          <Textarea
            label="Tiền sử phơi nhiễm bụi"
            placeholder="Ví dụ: nghiền đá 12 năm, có đeo khẩu trang"
            value={form.exposureHistory}
            onChange={change("exposureHistory")}
          />
          {tooLong(form.exposureHistory) && (
            <small className="field-error">Tối đa {PROFILE_MAX_TEXT} ký tự.</small>
          )}
          <Textarea
            label="Yếu tố nguy cơ"
            placeholder="Ví dụ: hút thuốc, bệnh phổi trước đây"
            value={form.riskFactors}
            onChange={change("riskFactors")}
          />
          {tooLong(form.riskFactors) && (
            <small className="field-error">Tối đa {PROFILE_MAX_TEXT} ký tự.</small>
          )}
        </>
      )}
      <div className="flex justify-end">
        <Button
          type="submit"
          busy={busy}
          disabled={
            form.name.trim().length < 2 ||
            !validEmail(form.email.trim()) ||
            !validVnMobile(form.phone) ||
            (!!form.birthDate && !validPastDate(form.birthDate)) ||
            tooLong(form.exposureHistory) ||
            tooLong(form.riskFactors)
          }
        >
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
}
