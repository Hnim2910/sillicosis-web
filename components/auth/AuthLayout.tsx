import type { ReactNode } from "react";
import { Activity, ClipboardCheck, ScanLine, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/common/Brand";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Brand light />
        <div className="auth-story-content">
          <span className="auth-pill">
            <Activity size={15} /> CHĂM SÓC SỨC KHỎE PHỔI
          </span>
          <h1>
            Thấu hiểu từng
            <br />
            nhịp thở.
          </h1>
          <p>
            Kết nối ảnh X-quang và dữ liệu sức khỏe, hỗ trợ theo dõi và sàng lọc bệnh bụi phổi
            silic.
          </p>
          <div className="auth-visual">
            <ScanLine size={115} strokeWidth={0.7} />
            <span className="auth-visual-ring" />
            <div className="auth-visual-label">
              <span className="status-dot" /> Sức khỏe phổi, trong tầm theo dõi
            </div>
          </div>
          <div className="auth-features">
            <span>
              <ClipboardCheck size={18} /> Hồ sơ tập trung
            </span>
            <span>
              <ShieldCheck size={18} /> Phân quyền theo vai trò
            </span>
          </div>
        </div>
        <small>SilicoCare · Frontend prototype</small>
      </section>
      <section className="auth-form-panel">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        {children}
        <p className="auth-footnote">Bản demo sử dụng dữ liệu giả lập. Không dùng để chẩn đoán.</p>
      </section>
    </main>
  );
}
