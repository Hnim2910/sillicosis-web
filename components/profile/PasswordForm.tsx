"use client";
import { useState } from "react";
import { authService } from "@/services/authService";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { errorMessage } from "@/utils/format";

export function PasswordForm() {
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setSuccess(false);
        try {
          await authService.changePassword(oldPassword, password);
          setSuccess(true);
          setOldPassword("");
          setPassword("");
          setConfirm("");
        } catch (reason) {
          setError(errorMessage(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">Đã đổi mật khẩu thành công.</Alert>}
      <Input
        label="Mật khẩu hiện tại"
        type="password"
        autoComplete="current-password"
        value={oldPassword}
        onChange={(event) => setOldPassword(event.target.value)}
        required
      />
      <Input
        label="Mật khẩu mới"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={8}
        error={password && password.length < 8 ? "Cần ít nhất 8 ký tự." : undefined}
      />
      <Input
        label="Xác nhận mật khẩu mới"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        required
        error={confirm && confirm !== password ? "Mật khẩu chưa khớp." : undefined}
      />
      <Button
        type="submit"
        busy={busy}
        disabled={!oldPassword || password.length < 8 || password !== confirm}
      >
        Đổi mật khẩu
      </Button>
    </form>
  );
}
