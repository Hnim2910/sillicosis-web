"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Alert } from "@/components/common/Feedback";
import { authService } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/utils/format";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
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
      <p className="auth-description">
        Đăng nhập bằng tài khoản được cấp. Hệ thống tự xác định vai trò và quyền truy cập của bạn.
      </p>
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
        <div className="password-field">
          <Input
            label="Mật khẩu"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu"
          />
          <button
            type="button"
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
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
      <p className="auth-role-note">Dành cho Bệnh nhân và Quản trị viên.</p>
    </div>
  );
}
