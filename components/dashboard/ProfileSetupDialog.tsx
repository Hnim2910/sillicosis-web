"use client";
import type { User } from "@/types/user";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { TieuSuForm } from "@/components/profile/TieuSuForm";

const key = (userId: string) => `silicocare.profileSetupLater.${userId}`;

/** "Để sau" is remembered for this browser session only; the dashboard keeps a reminder until it is filled in. */
export function setupPostponed(userId: string) {
  try {
    return sessionStorage.getItem(key(userId)) === "1";
  } catch {
    return false;
  }
}

function postpone(userId: string) {
  try {
    sessionStorage.setItem(key(userId), "1");
  } catch {
    // Private mode / storage blocked: the dialog may show again on the next visit, which is acceptable.
  }
}

/** Shown on the dashboard after the first sign-in while the profile has no gender, birth date or tiểu sử. */
export function ProfileSetupDialog({
  user,
  open,
  onClose,
}: {
  user: User;
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const later = () => {
    postpone(user.id);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={later}
      drawer
      title="Hoàn thiện tiểu sử"
      description="Thông tin này được điền sẵn vào form mỗi lần chẩn đoán"
    >
      <TieuSuForm
        user={user}
        submitLabel="Lưu"
        stickyActions
        onSaved={() => {
          toast({
            tone: "success",
            message:
              "Đã cập nhật tiểu sử. Thông tin sẽ được điền sẵn trong các lần chẩn đoán tiếp theo.",
          });
          onClose();
        }}
        secondaryAction={
          <Button variant="secondary" onClick={later}>
            Để sau
          </Button>
        }
      />
    </Modal>
  );
}
