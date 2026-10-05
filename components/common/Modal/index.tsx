"use client";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common/Button";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
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
      className="modal"
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
        <h2 id={titleId}>{title}</h2>
        <Button variant="ghost" aria-label="Đóng hộp thoại" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>
      {open && <div className="modal-body">{children}</div>}
    </dialog>
  );
}
