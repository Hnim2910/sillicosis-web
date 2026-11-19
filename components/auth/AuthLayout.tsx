import type { ReactNode } from "react";
import { ScanLine } from "lucide-react";
import { Brand } from "@/components/common/Brand";

/** Sign-in, sign-up and password recovery: one fixed screen, the product story on the left, the form on the right. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <Brand light />
        <div className="auth-story-content">
          <h1>Hệ thống Thông minh Chẩn đoán Bệnh bụi phổi Silic</h1>
          <p>
            Nền tảng AI hỗ trợ phân tích X-quang và thông tin lâm sàng để chẩn đoán bệnh bụi phổi
            silic.
          </p>
          <div className="auth-visual-area">
            <div className="auth-visual" aria-hidden="true">
              <span className="auth-visual-ring" />
              <ScanLine size={132} strokeWidth={0.8} />
            </div>
          </div>
        </div>
        <p className="auth-slogan">SilicoCare - Thấu hiểu từng nhịp thở.</p>
      </section>
      <section className="auth-form-panel">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        {children}
      </section>
    </main>
  );
}
