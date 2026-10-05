export function cn(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value: string, time = false) {
  if (!value) return "Chưa cập nhật";
  // Calendar dates carry no timezone; parsing as UTC can shift the displayed birthday.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  if (!Number.isFinite(date.getTime())) return "Ngày không hợp lệ";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(time ? ({ hour: "2-digit", minute: "2-digit" } as const) : {}),
  }).format(date);
}

export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thể hoàn tất thao tác. Vui lòng thử lại.";
}

export function searchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}
