"use client";
import { useState } from "react";
import type { Patient, PatientInput } from "@/types/patient";
import { Input, Select, Textarea } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { patientService } from "@/services/patientService";
import { errorMessage, today } from "@/utils/format";
import { validatePatient } from "@/utils/validation";
import { GENDER_LABELS } from "@/constants/app";

export function PatientForm({
  patient,
  onSaved,
  onCancel,
}: {
  patient?: Patient;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PatientInput>(
    patient || {
      name: "",
      birthDate: "",
      gender: "",
      phone: "",
      occupation: "",
      workplace: "",
      exposureHistory: "",
      riskFactors: "",
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change =
    (key: keyof PatientInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: event.target.value });
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
          await patientService.save(form, patient?.id);
          onSaved();
        } catch (reason) {
          setError(errorMessage(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <Alert>{error}</Alert>}
      <div className="form-grid">
        <Input
          label="Họ và tên"
          required
          value={form.name}
          onChange={change("name")}
          minLength={2}
          maxLength={150}
        />
        <Input
          label="Ngày sinh"
          required
          type="date"
          min="1900-01-01"
          max={today()}
          value={form.birthDate}
          onChange={change("birthDate")}
        />
        <Select label="Giới tính" value={form.gender} onChange={change("gender")}>
          <option value="">Chưa cập nhật</option>
          {Object.entries(GENDER_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Input label="Số điện thoại" type="tel" value={form.phone} onChange={change("phone")} />
        <Input
          label="Nghề nghiệp"
          required
          maxLength={150}
          value={form.occupation}
          onChange={change("occupation")}
        />
        <Input
          label="Nơi làm việc"
          maxLength={255}
          value={form.workplace}
          onChange={change("workplace")}
        />
      </div>
      <Textarea
        label="Tiền sử tiếp xúc bụi"
        maxLength={2000}
        value={form.exposureHistory}
        onChange={change("exposureHistory")}
      />
      <Textarea
        label="Yếu tố nguy cơ"
        maxLength={2000}
        value={form.riskFactors}
        onChange={change("riskFactors")}
      />
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Hủy
        </Button>
        <Button type="submit" busy={busy} disabled={!!validatePatient(form)}>
          Lưu hồ sơ
        </Button>
      </div>
    </form>
  );
}
