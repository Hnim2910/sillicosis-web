"use client";
import { useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
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

export function DashboardOverview() {
  const { user } = useAuth();
  const role = user?.role || "patient";
  const loader = useCallback(() => dashboardService.getOverview(role), [role]);
  const { data, loading, error, reload } = useAsync(loader);
  return (
    <>
      <PageHeader
        title="Tổng quan"
        description={`Chào ${user?.name || "bạn"}.`}
        action={
          role === "patient" && (
            <Link href="/prediction" className="btn btn-primary">
              <Plus size={16} />
              Dự đoán mới
            </Link>
          )
        }
      />
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error || "Chưa thể tải tổng quan."} retry={reload} />
      ) : (
        <>
          <StatCards
            role={role}
            patients={data.patients}
            visits={data.predictions.length}
            counts={data.counts}
          />
          <div className="dashboard-grid">
            <ResultDistribution normal={data.counts.Khong} silicosis={data.counts.Co} />
            <QuickActions role={role} />
          </div>
          <Card>
            <CardHeader
              title="Lượt chẩn đoán gần đây"
              action={
                <Link href="/history" className="text-link">
                  Xem tất cả
                  <ArrowRight size={14} />
                </Link>
              }
            />
            {data.predictions.length ? (
              <HistoryTable records={data.predictions.slice(0, 5)} showPatient={role === "admin"} />
            ) : (
              <EmptyState
                title="Chưa có lượt chẩn đoán nào"
                description="Kết quả sẽ hiện ở đây sau lần dự đoán đầu tiên."
              />
            )}
          </Card>
        </>
      )}
    </>
  );
}
