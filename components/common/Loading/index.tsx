import { LoaderCircle } from "lucide-react";

export function Loading({ label = "Đang tải dữ liệu…" }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="animate-spin text-teal-700" size={25} />
      <p>{label}</p>
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  );
}
