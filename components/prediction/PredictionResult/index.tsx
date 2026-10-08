"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ScanLine } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { predictionService } from "@/services/predictionService";
import { reportService } from "@/services/reportService";
import { RESULT_NOTICE, REVIEW_LABELS } from "@/constants/app";
import { errorMessage, formatDate } from "@/utils/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Loading } from "@/components/common/Loading";
import { Alert, ErrorState } from "@/components/common/Feedback";
import { ClinicalTable } from "@/components/patient/ClinicalRecords/ClinicalTable";
import { XrayViewer } from "@/components/prediction/XrayViewer";

export function PredictionResult({ id }: { id: string }) {
  const loader = useCallback(() => predictionService.get(id), [id]);
  const { data, loading, error, reload } = useAsync(loader);
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [message, setMessage] = useState("");
  if (loading) return <Loading />;
  if (error || !data)
    return <ErrorState message={error || "Không có dữ liệu kết quả."} retry={reload} />;
  const { prediction: record, patient } = data;
  return (
    <>
      <Link href="/history" className="text-link mb-5">
        <ArrowLeft size={14} />
        Lịch sử dự đoán
      </Link>
      <PageHeader
        title="Kết quả phân tích"
        description={`${patient.name} · ${record.id} · ${formatDate(record.createdAt, true)}`}
        action={
          <Button
            variant="secondary"
            busy={exporting}
            onClick={async () => {
              setExporting(true);
              setExportError("");
              try {
                await reportService.download(record, patient);
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
          <Card>
            <CardHeader
              title="Ảnh X-quang"
              description={record.image.name}
              action={<Badge tone="neutral">Demo</Badge>}
            />
            <div className="card-body">
              <XrayViewer image={record.image} />
            </div>
          </Card>
          <div className="stack">
            <Card>
              <CardHeader
                title="Kết quả mô phỏng"
                action={<ScanLine size={20} className="text-teal-600" />}
              />
              <div className="card-body">
                <div className={`result-label ${record.label.toLowerCase()}`}>{record.label}</div>
                <p className="notice mt-2">
                  {record.label === "Silicosis"
                    ? "Mô phỏng dữ liệu thuộc lớp Silicosis."
                    : "Mô phỏng dữ liệu thuộc lớp Normal."}
                </p>
                <div className="confidence-detail">
                  <span>Độ tin cậy mô phỏng</span>
                  <strong className="text-teal-700">{record.confidence.toFixed(1)}%</strong>
                </div>
                <div className="confidence-bar">
                  <div style={{ width: `${record.confidence}%` }} />
                </div>
                <div className="result-meta">
                  <div>
                    <span>Phiên bản mô hình</span>
                    <p>{record.modelVersion}</p>
                  </div>
                  <div>
                    <span>Người thực hiện</span>
                    <p>{record.performedBy}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <Alert tone="info">{RESULT_NOTICE}</Alert>
                </div>
              </div>
            </Card>
            {record.review && (
              <Card>
                <CardHeader title="Đánh giá đã lưu" description="Thông tin đánh giá từ hồ sơ trước đây." />
                <div className="card-body review-summary">
                  <p className="font-semibold mb-2">{REVIEW_LABELS[record.review.decision]}</p>
                  <p>{record.review.note}</p>
                  <small>{record.review.doctorName} · {formatDate(record.review.reviewedAt, true)}</small>
                </div>
              </Card>
            )}
          </div>
        </div>
        <Card>
          <CardHeader
            title="Dữ liệu đầu vào theo thời gian"
            description={`${record.clinicalRecords.length} mốc · Bản chụp dữ liệu tại thời điểm dự đoán`}
          />
          <ClinicalTable records={record.clinicalRecords} />
        </Card>
        {user?.role === "admin" && (
          <Card>
            <CardHeader
              title="Ghi chú quản trị"
              description={`Đánh giá mô hình: ${{ unreviewed: "Chưa đánh giá", correct: "Đúng", incorrect: "Sai" }[record.evaluation]}`}
            />
            <div className="card-body">
              <p>{record.adminNote || "Chưa có ghi chú."}</p>
              <Link href="/admin/records" className="text-link mt-4">
                Quản lý bản ghi
              </Link>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
