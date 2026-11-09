"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RefreshCw, ScanLine } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useImageUrl } from "@/hooks/useImageUrl";
import { visitService } from "@/services/visitService";
import { reportService } from "@/services/reportService";
import type { Prediction, Visit } from "@/types/visit";
import { CHANCE_LABEL, CLINICAL_RISK_TEXT, MODEL_LIMITATIONS, RESULT_NOTICE } from "@/constants/app";
import { errorMessage, formatDate } from "@/utils/format";
import {
  clinicalRiskLevel,
  clinicalRows,
  formatChance,
  formatPercent,
  hasLamSang,
  mainChance,
  predictionErrorText,
  recommendationText,
} from "@/utils/visitDisplay";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Loading } from "@/components/common/Loading";
import { Alert, ErrorState } from "@/components/common/Feedback";
import { XrayViewer } from "@/components/prediction/XrayViewer";

function PredictionDetail({ prediction }: { prediction: Prediction }) {
  const atRisk = prediction.ketLuanCuoi ?? prediction.label === "Co";
  const chance = mainChance(prediction);
  const level = clinicalRiskLevel(prediction);
  const newWay = prediction.pLamSang !== null && prediction.pLamSang !== undefined;
  const technical: [string, string][] = newWay
    ? [
        ["Điểm lâm sàng", formatPercent(prediction.pLamSang ?? 0)],
        ["Ngưỡng lâm sàng", formatPercent(prediction.nguongLamSang ?? 0)],
      ]
    : [
        ["Xác suất", formatPercent(prediction.probability ?? 0)],
        ["Ngưỡng", formatPercent(prediction.threshold ?? 0)],
      ];
  if (newWay && prediction.coAnh)
    technical.push(
      ["Điểm ảnh X-quang", formatPercent(prediction.pAnh ?? 0)],
      ["Điểm ghép ảnh + lâm sàng", formatPercent(prediction.pGhep ?? 0)],
      ["Ngưỡng ghép", formatPercent(prediction.nguongGhep ?? 0)],
    );
  technical.push(
    ["Mô hình", prediction.modelName || "Không rõ"],
    ["Phiên bản", prediction.modelVersion || "Không rõ"],
    ["Thời gian dự đoán", formatDate(prediction.createdAt, true)],
  );
  return (
    <>
      {chance !== null && (
        <div>
          <p className="text-sm text-slate-500">{CHANCE_LABEL}</p>
          <p className={`result-label ${atRisk ? "silicosis" : "normal"}`}>{formatChance(chance)}</p>
        </div>
      )}
      {level && (
        <p className={`result-label risk-${level}`}>{CLINICAL_RISK_TEXT[level].label}</p>
      )}
      <p className="font-semibold">{recommendationText(prediction)}</p>
      <details className="text-sm">
        <summary className="cursor-pointer text-slate-500">Chi tiết kỹ thuật</summary>
        <dl className="info-list mt-2">
          {technical.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </details>
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
      {running ? "Đang phân tích…" : label}
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
        {!visit.image && !hasLamSang(visit) ? (
          <p className="notice">
            Lượt khám này chưa có thông tin lâm sàng hay ảnh X-quang nên chưa thể dự đoán.
          </p>
        ) : !prediction ? (
          <>
            <p className="notice">Lượt khám này chưa được phân tích.</p>
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
            <p>{prediction.disclaimer}</p>
            <ul className="list-disc pl-5 mt-1">
              {MODEL_LIMITATIONS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
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
            disabled={!succeeded || (!!visit.image && !image.url)}
            title={succeeded ? undefined : "Chỉ xuất báo cáo khi đã có kết quả dự đoán."}
            onClick={async () => {
              setExporting(true);
              setExportError("");
              setMessage("");
              try {
                await reportService.download(visit, visit.image ? image.url : null);
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
            title="Thông tin lâm sàng"
            description="Các giá trị đã ghi nhận cho lượt khám này."
            action={<Badge tone="neutral">{rows.length} mục</Badge>}
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
              <p className="notice">Lượt khám này không nhập thông tin lâm sàng.</p>
            )}
          </div>
        </Card>
        <p className="notice">{RESULT_NOTICE}</p>
      </div>
    </>
  );
}
