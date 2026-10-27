"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RefreshCw, ScanLine } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useImageUrl } from "@/hooks/useImageUrl";
import { visitService } from "@/services/visitService";
import { reportService } from "@/services/reportService";
import type { Prediction, Visit } from "@/types/visit";
import { MODEL_SCOPE_NOTICE, OUTCOME_LABELS, RESULT_NOTICE } from "@/constants/app";
import { errorMessage, formatDate } from "@/utils/format";
import { clinicalRows, formatPercent, predictionErrorText } from "@/utils/visitDisplay";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Loading } from "@/components/common/Loading";
import { Alert, ErrorState } from "@/components/common/Feedback";
import { XrayViewer } from "@/components/prediction/XrayViewer";

function PredictionDetail({ prediction }: { prediction: Prediction }) {
  const probability = prediction.probability ?? 0;
  const threshold = prediction.threshold ?? 0;
  const positive = prediction.label === "Co";
  return (
    <>
      <div className={`result-label ${positive ? "silicosis" : "normal"}`}>
        {OUTCOME_LABELS[positive ? "Co" : "Khong"]}
      </div>
      <p className="notice mt-2">
        {positive
          ? "Xác suất mô hình đưa ra đạt hoặc vượt ngưỡng, ảnh được xếp vào nhóm nghi bụi phổi silic."
          : "Xác suất mô hình đưa ra thấp hơn ngưỡng, ảnh không được xếp vào nhóm nghi bụi phổi silic."}
      </p>
      <div className="confidence-detail">
        <span>Xác suất bụi phổi silic (ngưỡng {formatPercent(threshold)})</span>
        <strong className="text-teal-700">{formatPercent(probability)}</strong>
      </div>
      <div className="confidence-bar">
        <div style={{ width: `${Math.round(probability * 1000) / 10}%` }} />
      </div>
      <div className="result-meta">
        <div>
          <span>Mô hình</span>
          <p>{prediction.modelName || "Không rõ"}</p>
        </div>
        <div>
          <span>Phiên bản</span>
          <p>{prediction.modelVersion}</p>
        </div>
        <div>
          <span>Thời gian dự đoán</span>
          <p>{formatDate(prediction.createdAt, true)}</p>
        </div>
      </div>
    </>
  );
}

function ResultCard({
  visit,
  onPredicted,
}: {
  visit: Visit;
  onPredicted: (p: Prediction) => void;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const prediction = visit.latestPrediction;
  async function run() {
    setRunning(true);
    setError("");
    try {
      onPredicted(await visitService.predict(visit.id));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setRunning(false);
    }
  }
  const runButton = (label: string) => (
    <Button variant="secondary" busy={running} onClick={run}>
      <RefreshCw size={16} />
      {running ? "Đang phân tích ảnh…" : label}
    </Button>
  );
  return (
    <Card>
      <CardHeader
        title="Kết quả thử nghiệm"
        action={<ScanLine size={20} className="text-teal-600" />}
      />
      <div className="card-body stack">
        {error && <Alert>{error}</Alert>}
        {!visit.image ? (
          <p className="notice">Lượt khám này chưa có ảnh X-quang nên chưa thể dự đoán.</p>
        ) : !prediction ? (
          <>
            <p className="notice">Ảnh của lượt khám này chưa được phân tích.</p>
            {runButton("Chạy dự đoán")}
          </>
        ) : prediction.status === "FAILED" ? (
          <>
            <Alert>{predictionErrorText(prediction)}</Alert>
            <small className="text-slate-400">
              Lần thử gần nhất: {formatDate(prediction.createdAt, true)}
            </small>
            {runButton("Thử lại")}
          </>
        ) : (
          <PredictionDetail prediction={prediction} />
        )}
        {prediction?.status === "SUCCESS" && (
          <Alert tone="info">
            {prediction.disclaimer} {MODEL_SCOPE_NOTICE}
          </Alert>
        )}
      </div>
    </Card>
  );
}

function XrayCard({ visit, image }: { visit: Visit; image: ReturnType<typeof useImageUrl> }) {
  return (
    <Card>
      <CardHeader
        title="Ảnh X-quang"
        description={`Lượt khám ngày ${formatDate(visit.visitDate)}`}
      />
      <div className="card-body">
        {!visit.image ? (
          <p className="notice">Chưa có ảnh.</p>
        ) : image.error ? (
          <Alert>{image.error}</Alert>
        ) : image.loading ? (
          <Loading />
        ) : (
          <XrayViewer src={image.url} width={visit.image.width} height={visit.image.height} />
        )}
      </div>
    </Card>
  );
}

export function PredictionResult({ id }: { id: string }) {
  const loader = useCallback(() => visitService.get(id), [id]);
  const { data: visit, loading, error, reload, setData } = useAsync(loader);
  const image = useImageUrl(visit?.image?.id);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [message, setMessage] = useState("");
  if (loading) return <Loading />;
  if (error || !visit)
    return <ErrorState message={error || "Không có dữ liệu lượt khám."} retry={reload} />;
  const rows = clinicalRows(visit);
  const succeeded = visit.latestPrediction?.status === "SUCCESS";
  return (
    <>
      <Link href="/history" className="text-link mb-5">
        <ArrowLeft size={14} />
        Lịch sử dự đoán
      </Link>
      <PageHeader
        title="Kết quả phân tích"
        description={`${visit.patient.fullName} · ${visit.patient.code} · Ngày khám ${formatDate(visit.visitDate)}`}
        action={
          <Button
            variant="secondary"
            busy={exporting}
            disabled={!succeeded || !image.url}
            title={succeeded ? undefined : "Chỉ xuất báo cáo khi đã có kết quả dự đoán."}
            onClick={async () => {
              setExporting(true);
              setExportError("");
              setMessage("");
              try {
                await reportService.download(visit, image.url);
                setMessage("Đã tạo báo cáo PDF và gửi tới trình tải xuống.");
              } catch (reason) {
                setExportError(errorMessage(reason));
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download size={16} />
            Xuất báo cáo PDF
          </Button>
        }
      />
      <div className="stack">
        {message && <Alert tone="success">{message}</Alert>}
        {exportError && <Alert>{exportError}</Alert>}
        <div className="prediction-grid">
          <XrayCard visit={visit} image={image} />
          <ResultCard
            visit={visit}
            onPredicted={(prediction) => setData({ ...visit, latestPrediction: prediction })}
          />
        </div>
        <Card>
          <CardHeader
            title="Thông tin lượt khám"
            description="Được lưu để theo dõi; mô hình không dùng các chỉ số này."
            action={<Badge tone="neutral">{rows.length} chỉ số</Badge>}
          />
          <div className="card-body">
            {rows.length ? (
              <dl className="info-list">
                {rows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="notice">Lượt khám này không nhập chỉ số lâm sàng.</p>
            )}
          </div>
        </Card>
        <p className="notice">{RESULT_NOTICE}</p>
      </div>
    </>
  );
}
