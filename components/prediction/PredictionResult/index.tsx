"use client";
import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Download,
  HeartPulse,
  ImageOff,
  Info,
  Lightbulb,
  MapPinned,
  RefreshCw,
  ZoomIn,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useImageUrl } from "@/hooks/useImageUrl";
import { predictionOutcome, predictionService } from "@/services/predictionService";
import { reportService } from "@/services/reportService";
import type { Prediction } from "@/types/prediction";
import { NO_IMAGE_NOTE, OUTCOME_LABELS } from "@/constants/app";
import { VISIT_GROUPS } from "@/constants/clinicalFields";
import { RESULT_GUIDES } from "@/constants/resultGuide";
import type { ClinicalDraft } from "@/utils/clinicalForm";
import { errorMessage, formatDate } from "@/utils/format";
import { formatChance, predictionErrorText } from "@/utils/predictionDisplay";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Loading } from "@/components/common/Loading";
import { ErrorState } from "@/components/common/Feedback";
import { Modal } from "@/components/common/Modal";
import { ValueCell } from "@/components/common/FormSection";
import { useToast } from "@/components/common/Toast";
import { ClinicalSheetSection } from "@/components/prediction/ClinicalSummary";
import { XrayViewer } from "@/components/prediction/XrayViewer";

interface Metric {
  key: string;
  label: string;
  value: string;
}

interface Meaning {
  key: string;
  label: string;
  text: string;
}

const position = (value: number | null, threshold: number | null) =>
  value !== null && threshold !== null ? (value >= threshold ? "cao hơn" : "thấp hơn") : null;

/**
 * Values on the left, all taken from the model's response. Clinical-only results show no percentage (team decision).
 */
function metricsOf(prediction: Prediction): Metric[] {
  if (prediction.coAnh)
    return [
      { key: "ghep", label: "Điểm nguy cơ tổng hợp", value: formatChance(prediction.pGhep ?? 0) },
      { key: "anh", label: "Điểm từ phim X-quang", value: formatChance(prediction.pAnh ?? 0) },
      { key: "lamsang", label: "Điểm lâm sàng", value: formatChance(prediction.pLamSang ?? 0) },
    ];
  const side = position(prediction.pLamSang, prediction.nguongLamSang);
  return [
    {
      key: "lamsang",
      label: "Đánh giá lâm sàng",
      value:
        side === "cao hơn" ? "Gợi ý cần chụp phim kiểm tra" : side ? "Chưa gợi ý nguy cơ" : "-",
    },
    { key: "image", label: "Phim X-quang", value: "Chưa có" },
  ];
}

/**
 * What the values mean, including the thresholds the system uses, where this result sits against them and why they
 * were chosen (the thresholds catch at least 8 in 10 real cases on the test set: priority to not missing anyone).
 */
function meaningsOf(prediction: Prediction): Meaning[] {
  const why =
    "Ngưỡng đặt thấp để phát hiện ít nhất 8/10 người mắc bệnh trong dữ liệu kiểm thử, nên vượt ngưỡng chưa có nghĩa là đã mắc bệnh.";
  if (prediction.coAnh) {
    const fused = position(prediction.pGhep, prediction.nguongGhep);
    const clinical = position(prediction.pLamSang, prediction.nguongLamSang);
    return [
      {
        key: "ghep",
        label: "Điểm nguy cơ tổng hợp",
        text: "Kết hợp đánh giá từ phim X-quang và thông tin lâm sàng thành một điểm 0–100%; đây là chỉ số quyết định nhãn kết quả.",
      },
      {
        key: "nguong",
        label: `Ngưỡng sàng lọc ${formatChance(prediction.nguongGhep ?? 0)}`,
        text: `Điểm từ mức này trở lên được xếp “Có nguy cơ” (điểm của bạn ${fused ?? "-"} ngưỡng). ${why}`,
      },
      {
        key: "anh",
        label: "Điểm từ phim X-quang",
        text: "Đánh giá riêng trên phim ngực: điểm càng cao, phim càng có nhiều đặc điểm thường gặp ở người mắc bụi phổi silic.",
      },
      {
        key: "lamsang",
        label: "Điểm lâm sàng",
        text: `Từ tiểu sử, triệu chứng, chức năng hô hấp; ngưỡng riêng ${formatChance(prediction.nguongLamSang ?? 0)}, điểm của bạn ${clinical ?? "-"}. Thường thấp vì đa số người lao động không mắc bệnh.`,
      },
    ];
  }
  return [
    {
      key: "lamsang",
      label: "Đánh giá lâm sàng",
      text: `Thông tin lâm sàng được chấm điểm và so với ngưỡng sàng lọc ${formatChance(prediction.nguongLamSang ?? 0)} (điểm của bạn ${position(prediction.pLamSang, prediction.nguongLamSang) ?? "-"} ngưỡng). ${why}`,
    },
    { key: "image", label: "Phim X-quang", text: NO_IMAGE_NOTE },
  ];
}

/** Result card: score, label and values on the left, what they mean on the right, the label overview below. */
function ResultCard({
  prediction,
  onChange,
}: {
  prediction: Prediction;
  onChange: (p: Prediction) => void;
}) {
  const toast = useToast();
  const [retrying, setRetrying] = useState(false);
  const outcome = predictionOutcome(prediction);

  async function retry() {
    setRetrying(true);
    try {
      onChange(await predictionService.retry(prediction.id));
      toast({ tone: "success", message: "Đã chạy lại chẩn đoán cho lượt khám này." });
    } catch (reason) {
      toast({ tone: "error", message: `Chưa thể chạy lại chẩn đoán. ${errorMessage(reason)}` });
    } finally {
      setRetrying(false);
    }
  }

  if (outcome === "FAILED")
    return (
      <Card className="result-card result-card--failed">
        <div className="result-failed">
          <span className={`latest-band__label`}>{OUTCOME_LABELS.FAILED}</span>
          <p>{predictionErrorText(prediction)}</p>
          <p className="notice">
            Thông tin lâm sàng và phim của lượt khám đã được lưu. Bạn có thể chạy lại chẩn đoán mà
            không cần nhập lại.
          </p>
          <Button busy={retrying} onClick={retry}>
            <RefreshCw size={16} />
            Chạy lại chẩn đoán
          </Button>
        </div>
      </Card>
    );

  const metrics = metricsOf(prediction);
  const guide = RESULT_GUIDES.find((item) => item.outcome === outcome)!;
  const chance = prediction.coAnh ? formatChance(prediction.pGhep ?? 0) : null;

  return (
    <Card className="result-card">
      <div className="result-card__top">
        <section className="result-card__left" aria-labelledby="result-metrics">
          <div className={`latest-band latest-band--${outcome}`}>
            <div>
              <span className="latest-band__label">{guide.title}</span>
              <p>{chance ? "Tỷ lệ rủi ro mắc bệnh" : "Kết quả dựa trên thông tin lâm sàng"}</p>
            </div>
            {chance && <strong className="latest-band__chance">{chance}</strong>}
          </div>
          <h2 id="result-metrics" className="result-card__heading">
            Chi tiết thông số
          </h2>
          <dl className="metric-list">
            {metrics.map((metric) => (
              <div key={metric.key} className="metric-row">
                <dt>{metric.label}</dt>
                <dd>
                  <strong>{metric.value}</strong>
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="result-card__right" aria-labelledby="result-meaning">
          <h2 id="result-meaning" className="result-card__heading">
            <Info size={16} />Ý nghĩa các thông số
          </h2>
          <dl className="meaning-list">
            {meaningsOf(prediction).map((item) => (
              <div key={item.key}>
                <dt>{item.label}</dt>
                <dd>{item.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <section className="result-card__overview" aria-labelledby="result-overview">
        <div className="result-card__overview-head">
          <h2 id="result-overview" className="result-card__heading">
            Tổng quan nhãn “{guide.title}”
          </h2>
          <Link href={`/dashboard#result-guide-${outcome}`} className="text-link">
            Xem chi tiết
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overview-columns">
          <article>
            <h3>
              <HeartPulse size={16} />
              Tình trạng sức khỏe
            </h3>
            <p>{guide.overview.health}</p>
          </article>
          <article>
            <h3>
              <MapPinned size={16} />
              Hoàn cảnh, môi trường thường gặp
            </h3>
            <p>{guide.overview.context}</p>
          </article>
          <article>
            <h3>
              <Lightbulb size={16} />
              Lời khuyên
            </h3>
            <p>{guide.overview.advice}</p>
          </article>
        </div>
      </section>
    </Card>
  );
}

/** Patient information of the screening, laid out like the confirmation sheet of "Chẩn đoán mới". */
function PatientSheet({
  prediction,
  image,
}: {
  prediction: Prediction;
  image: ReturnType<typeof useImageUrl>;
}) {
  const [zoom, setZoom] = useState(false);
  const draft: ClinicalDraft = Object.fromEntries(
    Object.entries(prediction.lamSang ?? {}).map(([key, value]) => [key, String(value)]),
  );
  return (
    <Card className="exam-sheet">
      <div className="exam-sheet__header">
        <h2>Thông tin bệnh nhân</h2>
        <span className="exam-sheet__date">
          <CalendarDays size={16} />
          Ngày khám <strong>{formatDate(prediction.examDate)}</strong>
        </span>
      </div>
      <div className="exam-sheet__top">
        <div className="exam-sheet__image">
          <div className="exam-sheet__image-head">
            <span>Phim X-quang ngực</span>
          </div>
          {!prediction.image ? (
            <div className="confirm-no-image">
              <ImageOff size={28} />
              <p>{NO_IMAGE_NOTE}</p>
            </div>
          ) : image.url ? (
            <button type="button" className="confirm-image" onClick={() => setZoom(true)}>
              <Image
                src={image.url}
                alt="Phim X-quang của lượt chẩn đoán"
                width={prediction.image.width}
                height={prediction.image.height}
                unoptimized
              />
              <span className="confirm-image__zoom">
                <ZoomIn size={16} />
                Phóng to
              </span>
            </button>
          ) : (
            <div className="confirm-no-image">
              {image.error ? <p>{image.error}</p> : <Loading />}
            </div>
          )}
        </div>
        <div className="exam-sheet__side">
          <ClinicalSheetSection
            title="Hành chính"
            heading="Thông tin hành chính"
            draft={draft}
            span={4}
            before={
              <ValueCell label="Tên bệnh nhân" value={prediction.user?.fullName || "-"} span={4} />
            }
          />
          <ClinicalSheetSection
            title="Hút thuốc & tiền sử"
            heading="Tiền sử"
            draft={draft}
            span={4}
          />
        </div>
      </div>
      {["Nghề nghiệp & phơi nhiễm", ...VISIT_GROUPS].map((title) => (
        <ClinicalSheetSection key={title} title={title} draft={draft} />
      ))}
      <Modal open={zoom && !!image.url} onClose={() => setZoom(false)} title="Phim X-quang" wide>
        {prediction.image && image.url && (
          <XrayViewer
            src={image.url}
            width={prediction.image.width}
            height={prediction.image.height}
          />
        )}
      </Modal>
    </Card>
  );
}

export function PredictionResult({ id }: { id: string }) {
  const toast = useToast();
  const loader = useCallback(() => predictionService.get(id), [id]);
  const { data: prediction, loading, error, reload, setData } = useAsync(loader);
  const image = useImageUrl(prediction?.image ? prediction.id : null);
  const [exporting, setExporting] = useState(false);
  if (loading) return <Loading />;
  if (error || !prediction)
    return <ErrorState message={error || "Không có dữ liệu lượt chẩn đoán."} retry={reload} />;
  const succeeded = prediction.status === "SUCCESS";
  return (
    <>
      <PageHeader
        title="Kết quả chẩn đoán"
        description={`Ngày khám ${formatDate(prediction.examDate)}`}
        action={
          succeeded && (
            <Button
              variant="secondary"
              busy={exporting}
              disabled={!!prediction.image && !image.url}
              onClick={async () => {
                setExporting(true);
                try {
                  await reportService.download(prediction, prediction.image ? image.url : null);
                } catch (reason) {
                  toast({
                    tone: "error",
                    message: `Không thể xuất báo cáo PDF. ${errorMessage(reason)}`,
                  });
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
      <div className="stack result-page">
        <ResultCard prediction={prediction} onChange={setData} />
        <PatientSheet prediction={prediction} image={image} />
      </div>
    </>
  );
}
