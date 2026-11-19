"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastInput {
  tone: ToastTone;
  /** The specific message, e.g. "Đã nhập 12 trường thông tin từ tệp mẫu." */
  message: string;
  /** Defaults to the tone's title ("Thành công", "Có lỗi"…). */
  title?: string;
}

interface ToastItem extends Required<ToastInput> {
  id: number;
}

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, warning: TriangleAlert, info: Info };
export const TOAST_TITLES: Record<ToastTone, string> = {
  success: "Thành công",
  error: "Có lỗi",
  warning: "Cần kiểm tra",
  info: "Thông báo",
};
/** Errors and warnings stay longer: they usually ask the user to do something. */
const DURATION: Record<ToastTone, number> = {
  success: 4500,
  info: 5000,
  warning: 7000,
  error: 7000,
};

/**
 * One notification: slides in from the right; the bar at the bottom shows the time left and its animation end
 * closes the toast, so hovering pauses both.
 */
function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const Icon = ICONS[toast.tone];
  return (
    <div
      className={`toast toast-${toast.tone}`}
      role={toast.tone === "error" || toast.tone === "warning" ? "alert" : "status"}
      style={{ "--toast-duration": `${DURATION[toast.tone]}ms` } as CSSProperties}
    >
      <Icon size={22} className="toast-icon" aria-hidden="true" />
      <div className="toast-text">
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
      </div>
      <button type="button" className="toast-close" aria-label="Đóng thông báo" onClick={onClose}>
        <X size={18} />
      </button>
      <span className="toast-progress" aria-hidden="true" onAnimationEnd={onClose} />
    </div>
  );
}

/** Notifications in the top-right corner; mounted once in the workspace layout. The system's only toast style. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const remove = useCallback(
    (id: number) => setToasts((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const show = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    const item: ToastItem = { ...toast, title: toast.title ?? TOAST_TITLES[toast.tone], id };
    setToasts((current) => [...current.slice(-2), item]);
  }, []);
  return (
    <ToastContext value={show}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => remove(toast.id)} />
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast requires ToastProvider");
  return show;
}
