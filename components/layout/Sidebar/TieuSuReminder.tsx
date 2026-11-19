"use client";
import { useState } from "react";
import { ArrowUpRight, UserRoundPen } from "lucide-react";
import type { User } from "@/types/user";
import { ProfileSetupDialog } from "@/components/dashboard/ProfileSetupDialog";

/** The card is always shown to patients, whether or not the tiểu sử is already filled in. */
export function showTieuSuReminder(user: User) {
  return user.role === "patient";
}

/** Card at the bottom of the sidebar inviting the patient to fill in or update the tiểu sử; opens the form. */
export function TieuSuReminder({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="tieu-su-reminder">
        <span className="tieu-su-reminder__icon" aria-hidden="true">
          <UserRoundPen size={20} />
        </span>
        <strong>Hoàn thiện tiểu sử bản thân</strong>
        <p>
          Cập nhật sẵn thông tin lâm sàng để hệ thống tự động điền vào biểu mẫu trong mỗi lần chẩn
          đoán.
        </p>
        <button type="button" className="tieu-su-reminder__action" onClick={() => setOpen(true)}>
          Cập nhật tiểu sử ngay
          <ArrowUpRight size={15} />
        </button>
      </div>
      <ProfileSetupDialog user={user} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
