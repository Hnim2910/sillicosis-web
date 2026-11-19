"use client";
import { useState } from "react";
import { CheckCircle2, Circle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { authService } from "@/services/authService";
import { ApiError } from "@/lib/apiClient";
import { errorMessage } from "@/utils/format";
import { PASSWORD_REQUIREMENTS, validPassword } from "@/utils/validation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { FieldCell, FormSection } from "@/components/common/FormSection";
import { useToast } from "@/components/common/Toast";
import { cn } from "@/utils/format";

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  note,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string;
  note?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <FieldCell label={label} htmlFor={id} span={12} error={error} note={note} required>
      <div className="pw-input">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          maxLength={72}
          aria-invalid={!!error}
          aria-describedby={`${id}-message`}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="pw-input__toggle"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </FieldCell>
  );
}

/** Change password: current password, the new one twice, and the live list of requirements. */
export function ChangePasswordPage() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentError, setCurrentError] = useState("");
  const [busy, setBusy] = useState(false);

  const strong = validPassword(password);
  const same = !!password && password === current;
  const mismatch = !!confirm && confirm !== password;
  const canSubmit = !!current && strong && !same && !!confirm && !mismatch;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setCurrentError("");
    try {
      await authService.changePassword(current, password);
      setCurrent("");
      setPassword("");
      setConfirm("");
      toast({
        tone: "success",
        message:
          "Đổi mật khẩu thành công. Các thiết bị khác sẽ cần đăng nhập lại bằng mật khẩu mới.",
      });
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "WRONG_PASSWORD")
        setCurrentError("Mật khẩu hiện tại không chính xác.");
      toast({ tone: "error", message: `Không thể đổi mật khẩu. ${errorMessage(reason)}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Đổi mật khẩu"
        description="Cập nhật mật khẩu đăng nhập cho tài khoản của bạn"
      />
      <Card className="password-card">
        <form
          className="password-layout"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <FormSection title="Thông tin mật khẩu">
            <PasswordField
              id="pw-current"
              label="Mật khẩu hiện tại"
              autoComplete="current-password"
              value={current}
              onChange={(value) => {
                setCurrent(value);
                setCurrentError("");
              }}
              error={currentError}
            />
            <PasswordField
              id="pw-new"
              label="Mật khẩu mới"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              error={
                same
                  ? "Mật khẩu mới phải khác mật khẩu hiện tại."
                  : password && !strong
                    ? "Mật khẩu chưa đáp ứng đủ các yêu cầu bên cạnh."
                    : undefined
              }
            />
            <PasswordField
              id="pw-confirm"
              label="Xác nhận mật khẩu mới"
              autoComplete="new-password"
              value={confirm}
              onChange={setConfirm}
              error={mismatch ? "Mật khẩu xác nhận chưa khớp." : undefined}
            />
            <div className="password-actions">
              <Button type="submit" busy={busy} disabled={!canSubmit}>
                Đổi mật khẩu
              </Button>
            </div>
          </FormSection>

          <FormSection title="Yêu cầu mật khẩu">
            <div className="password-rules">
              <ul>
                {PASSWORD_REQUIREMENTS.map((rule) => {
                  const ok = rule.test(password);
                  return (
                    <li key={rule.id} className={cn(ok && "is-met")}>
                      {ok ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      <span>{rule.label}</span>
                      <span className="sr-only">{ok ? "(đã đạt)" : "(chưa đạt)"}</span>
                    </li>
                  );
                })}
                <li className={cn(!!password && !same && "is-met")}>
                  {!!password && !same ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  <span>Khác mật khẩu hiện tại</span>
                </li>
              </ul>
              <div className="password-tips">
                <ShieldCheck size={18} />
                <p>
                  Nên dùng cụm từ dễ nhớ với bạn nhưng khó đoán với người khác; không dùng họ tên,
                  ngày sinh, số điện thoại hay mật khẩu đã dùng ở trang web khác. Sau khi đổi, phiên
                  đăng nhập trên các thiết bị khác sẽ kết thúc.
                </p>
              </div>
            </div>
          </FormSection>
        </form>
      </Card>
    </>
  );
}
