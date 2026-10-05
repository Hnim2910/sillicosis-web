"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Alert } from "@/components/common/Feedback";
import { authService } from "@/services/authService";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/constants/app";
import { errorMessage } from "@/utils/format";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { data: demos } = useAsync(authService.getDemoAccounts);
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
      <p className="auth-description">Tiếp tục theo dõi và chăm sóc sức khỏe phổi.</p>
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
      <div className="demo-accounts">
        <div className="flex items-center justify-between gap-2">
          <strong>Khám phá bản demo</strong>
          <span>Mật khẩu: Demo@123</span>
        </div>
        <p>Chọn vai trò để điền thông tin đăng nhập.</p>
        <div className="demo-role-grid">
          {demos?.map((account) => (
            <Button
              key={account.role}
              variant="secondary"
              onClick={() => {
                setIdentifier(account.email);
                setPassword(account.password);
                setError("");
              }}
            >
              {ROLE_LABELS[account.role]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
