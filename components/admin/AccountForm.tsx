"use client";
import { useState } from "react";
import type { AccountInput } from "@/types/user";
import { userService, validateAccount } from "@/services/userService";
import { PASSWORD_RULE, validEmail, validPassword, validVnMobile } from "@/utils/validation";
import { errorMessage } from "@/utils/format";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";

/** Creates a patient account (role USER, with a linked patient record on the backend). */
export function AccountForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<AccountInput>({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const valid = !validateAccount(form);
  const change = (key: keyof AccountInput) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: event.target.value });
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
          await userService.create(form);
          onSaved();
        } catch (reason) {
          setError(errorMessage(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <Alert>{error}</Alert>}
      <Input
        label="Họ và tên"
        required
        maxLength={150}
        value={form.name}
        onChange={change("name")}
      />
      <div className="form-grid">
        <Input
          label="Email"
          type="email"
          required
          maxLength={255}
          value={form.email}
          onChange={change("email")}
          error={form.email && !validEmail(form.email.trim()) ? "Email không hợp lệ." : undefined}
        />
        <Input
          label="Số điện thoại (không bắt buộc)"
          type="tel"
          value={form.phone}
          onChange={change("phone")}
          error={
            !validVnMobile(form.phone) ? "Số điện thoại di động Việt Nam không hợp lệ." : undefined
          }
        />
      </div>
      <Input
        label="Mật khẩu"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
        value={form.password}
        onChange={change("password")}
        error={form.password && !validPassword(form.password) ? PASSWORD_RULE : undefined}
      />
      <p className="notice">
        Mật khẩu: {PASSWORD_RULE} Tài khoản mới có vai trò Bệnh nhân và được tạo kèm hồ sơ bệnh
        nhân; người dùng tự cập nhật ngày sinh, nghề nghiệp trong trang hồ sơ.
      </p>
      <div className="form-actions">
        <Button variant="secondary" disabled={busy} onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={!valid} busy={busy}>
          Tạo tài khoản
        </Button>
      </div>
    </form>
  );
}
