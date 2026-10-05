"use client";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { authService } from "@/services/authService";
import { errorMessage } from "@/utils/format";
import { validContact, validPhone } from "@/utils/validation";

export function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const valid =
    form.name.trim().length >= 2 &&
    validContact(form.email, form.phone) &&
    form.password.length >= 8 &&
    form.password === form.confirm;
  const change = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: event.target.value });
  return (
    <div className="auth-form">
      <p className="eyebrow">BẮT ĐẦU HÀNH TRÌNH</p>
      <h2>Tạo tài khoản</h2>
      <p className="auth-description">Theo dõi hồ sơ và kết quả sàng lọc của chính bạn.</p>
      {success ? (
        <div className="stack">
          <Alert tone="success">
            Đăng ký thành công. Bạn có thể đăng nhập bằng tài khoản vừa tạo.
          </Alert>
          <Link href="/login" className="btn btn-primary">
            Đến trang đăng nhập
          </Link>
        </div>
      ) : (
        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              await authService.register(form);
              setSuccess(true);
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
            value={form.name}
            onChange={change("name")}
            required
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={change("email")}
            required={!form.phone}
            autoComplete="email"
          />
          <Input
            label="Số điện thoại"
            required={!form.email}
            type="tel"
            value={form.phone}
            onChange={change("phone")}
            autoComplete="tel"
            error={
              form.phone && !validPhone(form.phone) ? "Số điện thoại không hợp lệ." : undefined
            }
          />
          <Input
            label="Mật khẩu"
            type="password"
            value={form.password}
            onChange={change("password")}
            minLength={8}
            required
            autoComplete="new-password"
            error={form.password && form.password.length < 8 ? "Tối thiểu 8 ký tự." : undefined}
          />
          <Input
            label="Xác nhận mật khẩu"
            type="password"
            value={form.confirm}
            onChange={change("confirm")}
            required
            autoComplete="new-password"
            error={
              form.confirm && form.confirm !== form.password
                ? "Mật khẩu xác nhận chưa khớp."
                : undefined
            }
          />
          <Button type="submit" disabled={!valid} busy={busy}>
            Tạo tài khoản bệnh nhân
          </Button>
        </form>
      )}
      <p className="auth-switch">
        Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
      </p>
    </div>
  );
}
