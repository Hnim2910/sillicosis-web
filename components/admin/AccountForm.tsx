"use client";
import { useState } from "react";
import type { AccountInput, Role, User } from "@/types/user";
import { ROLE_LABELS } from "@/constants/app";
import { userService } from "@/services/userService";
import { validContact, validPhone } from "@/utils/validation";
import { errorMessage } from "@/utils/format";
import { Input, Select } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";

export function AccountForm({
  user,
  currentUserId,
  onSaved,
  onCancel,
}: {
  user?: User;
  currentUserId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AccountInput>({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    role: user?.role || "patient",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const valid =
    form.name.trim().length >= 2 &&
    validContact(form.email, form.phone) &&
    ((user && !form.password) || form.password.length >= 8);
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
          await userService.save(form, user?.id);
          onSaved();
        } catch (reason) {
          setError(errorMessage(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <Alert>{error}</Alert>}
      <Input label="Họ và tên" required value={form.name} onChange={change("name")} />
      <div className="form-grid">
        <Input
          label="Email"
          type="email"
          required={!form.phone}
          value={form.email}
          onChange={change("email")}
        />
        <Input
          label="Số điện thoại"
          required={!form.email}
          type="tel"
          value={form.phone}
          onChange={change("phone")}
          error={form.phone && !validPhone(form.phone) ? "Số điện thoại không hợp lệ." : undefined}
        />
      </div>
      <Select
        label="Vai trò"
        value={form.role}
        disabled={user?.id === currentUserId}
        onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
      >
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <option key={role} value={role}>
            {label}
          </option>
        ))}
      </Select>
      <Input
        label={user ? "Mật khẩu mới (để trống để giữ nguyên)" : "Mật khẩu"}
        type="password"
        autoComplete="new-password"
        required={!user}
        minLength={8}
        value={form.password}
        onChange={change("password")}
        error={
          form.password && form.password.length < 8 ? "Mật khẩu cần ít nhất 8 ký tự." : undefined
        }
      />
      <div className="form-actions">
        <Button variant="secondary" disabled={busy} onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={!valid} busy={busy}>
          Lưu tài khoản
        </Button>
      </div>
    </form>
  );
}
