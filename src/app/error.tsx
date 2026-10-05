"use client";
import { ErrorState } from "@/components/common/Feedback";
export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState message="Có lỗi khi hiển thị màn hình. Vui lòng thử lại." retry={reset} />;
}
