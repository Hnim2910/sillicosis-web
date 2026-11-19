"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ImageOff,
  Lightbulb,
  MessageSquareText,
  RefreshCw,
  ScanLine,
} from "lucide-react";
import type { Prediction } from "@/types/prediction";
import { NO_IMAGE_NOTE, OUTCOME_LABELS } from "@/constants/app";
import { predictionOutcome, predictionService } from "@/services/predictionService";
import { errorMessage, formatDate } from "@/utils/format";
import { formatChance, predictionErrorText, resultBrief } from "@/utils/predictionDisplay";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";

function Score({
  label,
  value,
  threshold,
}: {
  label: string;
  value: number | null;
  threshold?: number | null;
}) {
  if (value === null || value === undefined) return null;
  const above = threshold !== null && threshold !== undefined ? value >= threshold : null;
  return (
    <div className="score-tile">
      <span>{label}</span>
      <strong>{formatChance(value)}</strong>
      {above !== null && (
        <small className={above ? "score-above" : "score-below"}>
          {above ? "Trên" : "Dưới"} ngưỡng {formatChance(threshold!)}
        </small>
      )}
    </div>
  );
}

/** "Kết quả chẩn đoán gần nhất": label (and % with an X-ray), the scores, one-line comment and two actions. */
export function LatestResultCard({
  prediction,
  onChange,
}: {
  prediction: Prediction | null;
  onChange: (prediction: Prediction) => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  if (!prediction)
    return (
      <Card className="latest-card latest-empty">
        <span className="latest-empty__icon">
          <ScanLine size={30} />
        </span>
        <h2>Chưa có lượt chẩn đoán nào</h2>
        <p>Kết quả gần nhất, nhận xét và lời khuyên sẽ hiện ở đây sau lần chẩn đoán đầu tiên.</p>
        <Link href="/prediction" className="btn btn-primary">
          Thực hiện chẩn đoán đầu tiên
          <ArrowRight size={15} />
        </Link>
      </Card>
    );

  const outcome = predictionOutcome(prediction);
  const brief = resultBrief(prediction);
  const withImage = !!prediction.coAnh;

  async function retry() {
    setRetrying(true);
    setError("");
    try {
      onChange(await predictionService.retry(prediction!.id));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setRetrying(false);
    }
  }

  return (
    <Card className="latest-card">
      <div className="latest-header">
        <div>
          <h2>Kết quả chẩn đoán gần nhất</h2>
          <p>
            <CalendarDays size={14} />
            Ngày khám {formatDate(prediction.examDate)}
          </p>
        </div>
        <Link href={`/prediction/${prediction.id}`} className="text-link">
          Xem chi tiết
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className={`latest-band latest-band--${outcome}`}>
        <div>
          <span className="latest-band__label">{OUTCOME_LABELS[outcome]}</span>
          {outcome === "FAILED" && <p>{predictionErrorText(prediction)}</p>}
        </div>
        {outcome !== "FAILED" && withImage && (
          <strong className="latest-band__chance">{formatChance(prediction.pGhep ?? 0)}</strong>
        )}
        {outcome === "FAILED" && (
          <Button variant="secondary" busy={retrying} onClick={retry}>
            <RefreshCw size={16} />
            Thử lại
          </Button>
        )}
      </div>
      {error && <Alert>{error}</Alert>}

      {outcome !== "FAILED" &&
        (withImage ? (
          <div className="score-grid">
            <Score label="Điểm ảnh X-quang" value={prediction.pAnh} />
            <Score
              label="Điểm lâm sàng"
              value={prediction.pLamSang}
              threshold={prediction.nguongLamSang}
            />
            <Score label="Điểm ghép" value={prediction.pGhep} threshold={prediction.nguongGhep} />
          </div>
        ) : (
          <p className="latest-no-image">
            <ImageOff size={16} />
            {NO_IMAGE_NOTE}
          </p>
        ))}

      {brief && (
        <div className="latest-insight">
          <section>
            <h3>
              <MessageSquareText size={16} />
              Nhận xét
            </h3>
            <p>{brief.comment}</p>
          </section>
          <section>
            <h3>
              <Lightbulb size={16} />
              Lời khuyên
            </h3>
            <ul>
              {brief.advice.map((line) => (
                <li key={line}>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Card>
  );
}
