"use client";
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
  const { data, loading, error, reload } = useAsync(dashboardService.getOverview);
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
              <p className="eyebrow !mt-0 !mb-2">HỖ TRỢ SÀNG LỌC SILICOSIS</p>
              <h2>Mỗi lần theo dõi, thêm một góc nhìn.</h2>
              <p>
                Quản lý hồ sơ và kết nối dữ liệu theo thời gian để hỗ trợ quá trình đánh giá sức
                khỏe phổi.
              </p>
              <Link
                href={user?.role === "admin" ? "/admin/records" : "/prediction"}
                className="btn btn-primary"
              >
                {user?.role === "admin" ? "Quản lý bản ghi" : "Bắt đầu dự đoán"}
                <ArrowRight size={15} />
              </Link>
            </div>
            <ScanLine className="hero-icon" size={95} strokeWidth={0.85} />
          </div>
          <StatCards
            patients={data.patients.length}
            predictions={data.total}
            reviewed={data.total - data.pending}
            pending={data.pending}
          />
          <div className="dashboard-grid">
            <ResultDistribution normal={data.normal} silicosis={data.silicosis} />
            <QuickActions role={user?.role || "patient"} />
          </div>
          <Card>
            <CardHeader
              title="Các lần phân tích gần đây"
              description="Cập nhật gần nhất trong phạm vi truy cập của bạn"
              action={
                <Link href="/history" className="text-link">
                  Xem tất cả
                  <ArrowRight size={14} />
                </Link>
              }
            />
            {data.records.length ? (
              <HistoryTable records={data.records.slice(0, 5)} patients={data.patients} />
            ) : (
              <EmptyState
                title="Chưa có lần phân tích nào"
                description="Bắt đầu dự đoán để xem kết quả tại đây."
              />
            )}
            <div className="table-footer">
              <span>
                {Math.min(data.records.length, 5)} / {data.records.length} bản ghi
              </span>
              <span>Chỉ sử dụng cho mục đích demo</span>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
