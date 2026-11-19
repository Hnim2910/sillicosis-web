"use client";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common/Button";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
  drawer = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Action buttons, kept visible at the bottom while the body scrolls. */
  footer?: ReactNode;
  wide?: boolean;
  /** Full-height panel against the right edge instead of a centred box. */
  drawer?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!open) {
      element?.close();
      return;
    }
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
      element?.close();
      focused?.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className={drawer ? "modal modal-drawer" : wide ? "modal modal-wide" : "modal"}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p className="modal-description">{description}</p>}
        </div>
        <Button variant="ghost" aria-label="Đóng hộp thoại" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>
      {open && <div className="modal-body">{children}</div>}
      {open && footer && <div className="modal-footer">{footer}</div>}
    </dialog>
  );
}
