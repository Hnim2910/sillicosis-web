import { AlertCircle, CheckCircle2, Inbox } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { ReactNode } from "react";

export function Alert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`alert alert-${tone}`}>
      <Icon size={18} />
      <div>{children}</div>
    </div>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="empty-state">
      <AlertCircle size={32} className="text-rose-500" />
      <h3>Chưa thể tải dữ liệu</h3>
      <p>{message}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
export function EmptyState({
  title = "Chưa có dữ liệu",
  description = "Dữ liệu sẽ xuất hiện tại đây khi có bản ghi mới.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={26} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
