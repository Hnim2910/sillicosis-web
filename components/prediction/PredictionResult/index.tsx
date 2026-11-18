"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useImageUrl } from "@/hooks/useImageUrl";
import { predictionService } from "@/services/predictionService";
import { reportService } from "@/services/reportService";
import type { Prediction } from "@/types/prediction";
import { CHANCE_LABEL, CLINICAL_RISK_TEXT, MODEL_LIMITATIONS } from "@/constants/app";
import { errorMessage, formatDate } from "@/utils/format";
import {
  clinicalRiskLevel,
  clinicalRows,
  formatChance,
  formatPercent,
  mainChance,
  predictionErrorText,
  recommendationText,
} from "@/utils/predictionDisplay";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Loading } from "@/components/common/Loading";
import { Alert, ErrorState } from "@/components/common/Feedback";
import { XrayViewer } from "@/components/prediction/XrayViewer";

function SuccessDetail({ prediction }: { prediction: Prediction }) {
  const chance = mainChance(prediction);
  const level = clinicalRiskLevel(prediction);
  const technical: [string, string][] = [
    ["Điểm lâm sàng", formatPercent(prediction.pLamSang ?? 0)],
    ["Ngưỡng lâm sàng", formatPercent(prediction.nguongLamSang ?? 0)],
  ];
  if (prediction.coAnh)
    technical.push(
      ["Điểm ảnh X-quang", formatPercent(prediction.pAnh ?? 0)],
      ["Điểm ghép ảnh + lâm sàng", formatPercent(prediction.pGhep ?? 0)],
      ["Ngưỡng ghép", formatPercent(prediction.nguongGhep ?? 0)],
    );
  technical.push(
    ["Mô hình", prediction.modelName || "Không rõ"],
    ["Phiên bản", prediction.modelVersion || "Không rõ"],
  );
  return (
    <>
      {chance !== null && (
        <div>
          <p className="text-sm text-slate-600">{CHANCE_LABEL}</p>
          <p className={`result-label ${prediction.ketLuanCuoi ? "silicosis" : "normal"}`}>
            {formatChance(chance)}
          </p>
        </div>
      )}
      {level && <p className={`result-label risk-${level}`}>{CLINICAL_RISK_TEXT[level].label}</p>}
      <p className="font-semibold">{recommendationText(prediction)}</p>
      <details className="text-sm">
        <summary className="cursor-pointer text-slate-600">Chi tiết kỹ thuật</summary>
        <dl className="info-list mt-2">
          {technical.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </details>
      <Alert tone="info">
        <ul className="list-disc pl-5">
          {MODEL_LIMITATIONS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Alert>
    </>
  );
}

function ResultCard({
  prediction,
  onChange,
}: {
  prediction: Prediction;
  onChange: (p: Prediction) => void;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  async function retry() {
    setRunning(true);
    setError("");
    try {
      onChange(await predictionService.retry(prediction.id));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setRunning(false);
    }
  }
  return (
    <Card>
      <CardHeader title="Kết quả" />
      <div className="card-body stack">
        {error && <Alert>{error}</Alert>}
        {prediction.status === "FAILED" ? (
          <>
            <Alert>{predictionErrorText(prediction)}</Alert>
            <Button variant="secondary" busy={running} onClick={retry}>
              <RefreshCw size={16} />
              {running ? "Đang phân tích…" : "Thử lại"}
            </Button>
          </>
        ) : (
          <SuccessDetail prediction={prediction} />
        )}
      </div>
    </Card>
  );
}

function XrayCard({ prediction, image }: { prediction: Prediction; image: ReturnType<typeof useImageUrl> }) {
  return (
    <Card>
      <CardHeader title="Ảnh X-quang" />
      <div className="card-body">
        {!prediction.image ? (
          <p className="notice">Không gửi ảnh; kết quả chỉ dựa trên thông tin lâm sàng.</p>
        ) : image.error ? (
          <Alert>{image.error}</Alert>
        ) : image.loading ? (
          <Loading />
        ) : (
          <XrayViewer src={image.url} width={prediction.image.width} height={prediction.image.height} />
        )}
      </div>
    </Card>
  );
}

export function PredictionResult({ id }: { id: string }) {
  const loader = useCallback(() => predictionService.get(id), [id]);
  const { data: prediction, loading, error, reload, setData } = useAsync(loader);
  const image = useImageUrl(prediction?.image ? prediction.id : null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  if (loading) return <Loading />;
  if (error || !prediction)
    return <ErrorState message={error || "Không có dữ liệu lượt chẩn đoán."} retry={reload} />;
  const rows = clinicalRows(prediction);
  const succeeded = prediction.status === "SUCCESS";
  return (
    <>
      <Link href="/history" className="text-link mb-5">
        <ArrowLeft size={14} />
        Lịch sử dự đoán
      </Link>
      <PageHeader
        title="Kết quả chẩn đoán"
        description={`Ngày khám ${formatDate(prediction.examDate)}${
          prediction.user?.code ? ` · ${prediction.user.fullName} · ${prediction.user.code}` : ""
        }`}
        action={
          succeeded && (
            <Button
              variant="secondary"
              busy={exporting}
              disabled={!!prediction.image && !image.url}
              onClick={async () => {
                setExporting(true);
                setExportError("");
                try {
                  await reportService.download(prediction, prediction.image ? image.url : null);
                } catch (reason) {
                  setExportError(errorMessage(reason));
                } finally {
                  setExporting(false);
                }
              }}
            >
              <Download size={16} />
              Xuất PDF
            </Button>
          )
        }
      />
      <div className="stack">
        {exportError && <Alert>{exportError}</Alert>}
        <div className="prediction-grid">
          <ResultCard prediction={prediction} onChange={setData} />
          <XrayCard prediction={prediction} image={image} />
        </div>
        <Card>
          <CardHeader title="Thông tin lâm sàng đã gửi" />
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
              <p className="notice">Không có thông tin lâm sàng.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
