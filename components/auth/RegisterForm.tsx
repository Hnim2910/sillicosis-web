"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/utils/format";
import { PASSWORD_RULE, validEmail, validPassword, validVnMobile } from "@/utils/validation";

export function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useAuth();
  const router = useRouter();
  const valid =
    form.name.trim().length >= 2 &&
    validEmail(form.email.trim()) &&
    validVnMobile(form.phone) &&
    validPassword(form.password) &&
    form.password === form.confirm;
  const change = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: event.target.value });
  return (
    <div className="auth-form">
      <p className="eyebrow">BẮT ĐẦU HÀNH TRÌNH</p>
      <h2>Tạo tài khoản</h2>
      <p className="auth-description">Theo dõi hồ sơ và kết quả sàng lọc của chính bạn.</p>
      <form
        className="stack"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            // The backend signs the new account in, so go straight to the workspace.
            await authService.register(form);
            await refresh();
            router.replace("/dashboard");
          } catch (reason) {
            setError(errorMessage(reason));
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
          maxLength={150}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={change("email")}
          required
          autoComplete="email"
          error={form.email && !validEmail(form.email.trim()) ? "Email không hợp lệ." : undefined}
        />
        <Input
          label="Số điện thoại (không bắt buộc)"
          type="tel"
          value={form.phone}
          onChange={change("phone")}
          autoComplete="tel"
          error={!validVnMobile(form.phone) ? "Số di động Việt Nam không hợp lệ." : undefined}
        />
        <Input
          label="Mật khẩu"
          type="password"
          value={form.password}
          onChange={change("password")}
          maxLength={72}
          required
          autoComplete="new-password"
          error={
            form.password && !validPassword(form.password) ? `Cần ${PASSWORD_RULE}` : undefined
          }
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
      <p className="auth-switch">
        Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
      </p>
    </div>
  );
}
