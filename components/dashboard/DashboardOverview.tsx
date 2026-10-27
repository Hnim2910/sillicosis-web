"use client";
import { useCallback } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ScanLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { dashboardService } from "@/services/dashboardService";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Loading } from "@/components/common/Loading";
import { EmptyState, ErrorState } from "@/components/common/Feedback";
import { HistoryTable } from "@/components/prediction/PredictionHistory/HistoryTable";
import { StatCards } from "./StatCards";
import { ResultDistribution } from "./ResultDistribution";
import { QuickActions } from "./QuickActions";
import { formatDate, today } from "@/utils/format";

export function DashboardOverview() {
  const { user } = useAuth();
  const role = user?.role || "patient";
  const loader = useCallback(() => dashboardService.getOverview(role), [role]);
  const { data, loading, error, reload } = useAsync(loader);
  return (
    <>
      <PageHeader
        title="Tổng quan"
        description={`Chào ${user?.name || "bạn"}, cùng theo dõi sức khỏe phổi hôm nay.`}
        action={
          <span className="btn btn-secondary">
            <CalendarDays size={15} />
            {formatDate(today())}
          </span>
        }
      />
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error || "Chưa thể tải tổng quan."} retry={reload} />
      ) : (
        <>
          <div className="welcome-banner">
            <div>
              <p className="eyebrow !mt-0 !mb-2">HỖ TRỢ SÀNG LỌC BỤI PHỔI SILIC</p>
              <h2>Mỗi lần theo dõi, thêm một góc nhìn.</h2>
              <p>
                Lưu từng lượt khám kèm ảnh X-quang ngực và nhận kết quả thử nghiệm từ mô hình AI để
                theo dõi sức khỏe phổi theo thời gian.
              </p>
              <Link
                href={role === "admin" ? "/admin/records" : "/prediction"}
                className="btn btn-primary"
              >
                {role === "admin" ? "Quản lý bản ghi" : "Bắt đầu dự đoán"}
                <ArrowRight size={15} />
              </Link>
            </div>
            <ScanLine className="hero-icon" size={95} strokeWidth={0.85} />
          </div>
          <StatCards
            role={role}
            patients={data.patients}
            visits={data.visits.length}
            counts={data.counts}
          />
          <div className="dashboard-grid">
            <ResultDistribution normal={data.counts.Khong} silicosis={data.counts.Co} />
            <QuickActions role={role} />
          </div>
          <Card>
            <CardHeader
              title="Lượt khám gần đây"
              description="Mới nhất trong phạm vi truy cập của bạn"
              action={
                <Link href="/history" className="text-link">
                  Xem tất cả
                  <ArrowRight size={14} />
                </Link>
              }
            />
            {data.visits.length ? (
              <HistoryTable records={data.visits.slice(0, 5)} showPatient={role === "admin"} />
            ) : (
              <EmptyState
                title="Chưa có lượt khám nào"
                description="Bắt đầu dự đoán để xem kết quả tại đây."
              />
            )}
            <div className="table-footer">
              <span>
                {Math.min(data.visits.length, 5)} / {data.visits.length} lượt khám
              </span>
              <span>Kết quả AI mang tính thử nghiệm</span>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
