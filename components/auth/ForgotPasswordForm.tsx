"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/apiClient";
import { errorMessage } from "@/utils/format";
import { PASSWORD_RULE, validEmail, validPassword } from "@/utils/validation";

// Backend only sends a new code 60 s after the previous one.
const RESEND_SECONDS = 60;

type Step = "email" | "otp" | "password" | "done";

const STEP_TEXT: Record<Step, string> = {
  email: "Nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác nhận gồm 6 chữ số.",
  otp: "Nhập mã gồm 6 chữ số trong email. Mã có hiệu lực trong 5 phút.",
  password: "Tạo mật khẩu mới cho tài khoản của bạn.",
  done: "Mật khẩu đã được đặt lại.",
};

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  // Same message whether or not the email is registered.
  const sendCode = () =>
    run(async () => {
      setNotice(await authService.forgotPassword(email));
      setOtp("");
      setStep("otp");
      setCountdown(RESEND_SECONDS);
    });

  const verify = () =>
    run(async () => {
      try {
        setResetToken(await authService.verifyOtp(email, otp));
        setNotice("");
        setStep("password");
      } catch (reason) {
        if (reason instanceof ApiError && reason.code === "OTP_ATTEMPTS_EXCEEDED") setOtp("");
        throw reason;
      }
    });

  const reset = () =>
    run(async () => {
      try {
        await authService.resetPassword(resetToken, password);
        setResetToken("");
        setPassword("");
        setConfirm("");
        setStep("done");
      } catch (reason) {
        if (reason instanceof ApiError && reason.code === "INVALID_RESET_TOKEN") {
          setResetToken("");
          setStep("email");
          throw new Error("Phiên đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới.");
        }
        throw reason;
      }
    });

  return (
    <div className="auth-form">
      <p className="eyebrow">KHÔI PHỤC TÀI KHOẢN</p>
      <h2>Quên mật khẩu</h2>
      <p className="auth-description">{STEP_TEXT[step]}</p>
      <div className="stack">
        {error && <Alert>{error}</Alert>}
        {notice && step === "otp" && <Alert tone="info">{notice}</Alert>}
        {step === "email" && (
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              void sendCode();
            }}
          >
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Nhập email đã đăng ký"
            />
            <Button type="submit" busy={busy} disabled={!validEmail(email.trim())}>
              Gửi mã xác nhận
            </Button>
          </form>
        )}
        {step === "otp" && (
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              void verify();
            }}
          >
            <Input
              label="Mã xác nhận"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6 chữ số"
            />
            <div className="otp-resend">
              <button type="button" onClick={() => setStep("email")}>
                Đổi email
              </button>
              <button
                type="button"
                disabled={busy || countdown > 0}
                onClick={() => void sendCode()}
              >
                {countdown > 0 ? `Gửi lại mã sau ${countdown} giây` : "Gửi lại mã"}
              </button>
            </div>
            <Button type="submit" busy={busy} disabled={otp.length !== 6}>
              Xác nhận mã
            </Button>
          </form>
        )}
        {step === "password" && (
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              void reset();
            }}
          >
            <Input
              label="Mật khẩu mới"
              type="password"
              autoComplete="new-password"
              required
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={password && !validPassword(password) ? `Cần ${PASSWORD_RULE}` : undefined}
            />
            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              error={confirm && confirm !== password ? "Mật khẩu xác nhận chưa khớp." : undefined}
            />
            <Button
              type="submit"
              busy={busy}
              disabled={!validPassword(password) || password !== confirm}
            >
              Đặt lại mật khẩu
            </Button>
          </form>
        )}
        {step === "done" && (
          <>
            <Alert tone="success">
              Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.
            </Alert>
            <Link href="/login" className="btn btn-primary">
              Đến trang đăng nhập
            </Link>
          </>
        )}
      </div>
      {step !== "done" && (
        <p className="auth-switch">
          <Link href="/login">
            <ArrowLeft size={13} className="inline" /> Quay lại đăng nhập
          </Link>
        </p>
      )}
    </div>
  );
}
