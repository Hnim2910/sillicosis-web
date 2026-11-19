"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Alert } from "@/components/common/Feedback";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/utils/format";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useAuth();
  const router = useRouter();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await authService.login(identifier, password);
      await refresh();
      router.replace(user.role === "admin" ? "/admin/users" : "/dashboard");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-form">
      <p className="eyebrow">CHÀO MỪNG TRỞ LẠI</p>
      <h2>Đăng nhập SilicoCare</h2>
      <p className="auth-description">Đăng nhập bằng email hoặc số điện thoại đã đăng ký.</p>
      <form onSubmit={submit} className="stack">
        {error && <Alert>{error}</Alert>}
        <Input
          label="Email hoặc số điện thoại"
          autoComplete="username"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Nhập email hoặc số điện thoại"
        />
        <PasswordInput
          label="Mật khẩu"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Nhập mật khẩu"
        />
        <p className="auth-forgot">
          <Link href="/forgot-password">Quên mật khẩu?</Link>
        </p>
        <Button
          type="submit"
          busy={busy}
          disabled={!identifier.trim() || !password}
          className="w-full"
        >
          Đăng nhập <ArrowRight size={17} />
        </Button>
      </form>
      <p className="auth-switch">
        Chưa có tài khoản? <Link href="/register">Đăng ký tài khoản bệnh nhân</Link>
      </p>
    </div>
  );
}
