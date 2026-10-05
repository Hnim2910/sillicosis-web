import Link from "next/link";
export default function NotFoundPage() {
  return (
    <main className="empty-state">
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn không tồn tại trong SilicoCare.</p>
      <Link className="btn btn-primary" href="/dashboard">
        Về tổng quan
      </Link>
    </main>
  );
}
