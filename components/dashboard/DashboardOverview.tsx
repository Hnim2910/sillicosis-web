"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowRight, ScanLine, UserRoundPen } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { dashboardService } from "@/services/dashboardService";
import { predictionOutcome } from "@/services/predictionService";
import type { Prediction, PredictionOutcome } from "@/types/prediction";
import type { User } from "@/types/user";
import { needsProfileSetup } from "@/utils/tieuSu";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Loading } from "@/components/common/Loading";
import { EmptyState, ErrorState } from "@/components/common/Feedback";
import { HistoryTable } from "@/components/prediction/PredictionHistory/HistoryTable";
import { StatCards } from "./StatCards";
import { ResultDistribution } from "./ResultDistribution";
import { QuickActions } from "./QuickActions";
import { PatientKpis } from "./PatientKpis";
import { LatestResultCard } from "./LatestResultCard";
import { RecentPredictions } from "./RecentPredictions";
import { ResultGuide } from "./ResultGuide";
import { ProfileSetupDialog, setupPostponed } from "./ProfileSetupDialog";

function countOutcomes(predictions: Prediction[]) {
  const counts: Record<PredictionOutcome, number> = { Co: 0, Khong: 0, FAILED: 0 };
  for (const prediction of predictions) counts[predictionOutcome(prediction)] += 1;
  return counts;
}

function PatientOverview({ user }: { user: User }) {
  const loader = useCallback(() => dashboardService.getOverview("patient"), []);
  const { data, loading, error, reload, setData } = useAsync(loader);
  const [setupOpen, setSetupOpen] = useState(
    () => needsProfileSetup(user) && !setupPostponed(user.id),
  );
  const incomplete = needsProfileSetup(user);

  const replace = (updated: Prediction) =>
    data &&
    setData({
      ...data,
      predictions: data.predictions.map((item) => (item.id === updated.id ? updated : item)),
    });

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description={`Chào ${user.name}, cùng theo dõi sức khỏe phổi hôm nay.`}
        action={
          <>
            {incomplete && (
              <Button variant="secondary" onClick={() => setSetupOpen(true)}>
                <UserRoundPen size={16} />
                Hoàn thiện tiểu sử
              </Button>
            )}
            <Link href="/prediction" className="btn btn-primary">
              <ScanLine size={16} />
              Chẩn đoán mới
            </Link>
          </>
        }
      />

      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error || "Chưa thể tải tổng quan."} retry={reload} />
      ) : (
        <div className="stack overview">
          <div className="overview-main">
            <PatientKpis predictions={data.predictions} now={data.loadedAt} />
            <LatestResultCard prediction={data.predictions[0] ?? null} onChange={replace} />
          </div>
          <div className="overview-row">
            <ResultDistribution counts={countOutcomes(data.predictions)} />
            <RecentPredictions predictions={data.predictions} />
          </div>
          <ResultGuide />
        </div>
      )}
      <ProfileSetupDialog user={user} open={setupOpen} onClose={() => setSetupOpen(false)} />
    </>
  );
}

/** Admin dashboard: unchanged layout for now (admin pages are out of scope of this redesign). */
function AdminOverview() {
  const loader = useCallback(() => dashboardService.getOverview("admin"), []);
  const { data, loading, error, reload } = useAsync(loader);
  return (
    <>
      <PageHeader title="Tổng quan" description="Hoạt động sàng lọc của mọi bệnh nhân." />
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error || "Chưa thể tải tổng quan."} retry={reload} />
      ) : (
        <>
          <StatCards
            role="admin"
            patients={data.patients}
            visits={data.predictions.length}
            counts={data.counts}
          />
          <div className="dashboard-grid">
            <ResultDistribution counts={data.counts} />
            <QuickActions role="admin" />
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
              <HistoryTable records={data.predictions.slice(0, 5)} showPatient />
            ) : (
              <EmptyState title="Chưa có lượt chẩn đoán nào" />
            )}
          </Card>
        </>
      )}
    </>
  );
}

export function DashboardOverview() {
  const { user } = useAuth();
  if (!user) return <Loading />;
  return user.role === "admin" ? <AdminOverview /> : <PatientOverview key={user.id} user={user} />;
}
