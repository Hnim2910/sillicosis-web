import Link from "next/link";
import { ArrowRight, ChevronRight, Menu } from "lucide-react";
import type { Prediction } from "@/types/prediction";
import { OUTCOME_LABELS, OUTCOME_TONES } from "@/constants/app";
import { predictionOutcome } from "@/services/predictionService";
import { formatDate } from "@/utils/format";
import { formatChance, mainChance } from "@/utils/predictionDisplay";
import { Card, CardHeader } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/Feedback";

/** The five most recent screenings, compact enough to sit beside the distribution chart. */
export function RecentPredictions({ predictions }: { predictions: Prediction[] }) {
  return (
    <Card className="h-full">
      <CardHeader
        title="Các lượt chẩn đoán gần đây"
        action={
          <Link href="/history" className="text-link">
            Xem tất cả
            <ArrowRight size={14} />
          </Link>
        }
      />
      {predictions.length ? (
        <div className="recent-table">
          <table className="compact-table bordered-table">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col />
              <col style={{ width: "13%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "52px" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Ngày khám</th>
                <th>Kết quả</th>
                <th>Điểm</th>
                <th>X-quang</th>
                <th className="action-col">
                  <Menu size={16} aria-label="Thao tác" />
                </th>
              </tr>
            </thead>
            <tbody>
              {predictions.slice(0, 5).map((prediction) => {
                const outcome = predictionOutcome(prediction);
                const chance = mainChance(prediction);
                return (
                  <tr key={prediction.id}>
                    <td>{formatDate(prediction.examDate)}</td>
                    <td>
                      <Badge tone={OUTCOME_TONES[outcome]}>{OUTCOME_LABELS[outcome]}</Badge>
                    </td>
                    <td className="font-semibold">
                      {chance === null ? "—" : formatChance(chance)}
                    </td>
                    <td>{prediction.image ? "Có" : "Không"}</td>
                    <td className="action-col">
                      <Link
                        href={`/prediction/${prediction.id}`}
                        className="icon-link"
                        aria-label={`Xem lượt ngày ${formatDate(prediction.examDate)}`}
                      >
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Chưa có lượt chẩn đoán nào"
          description="Các lượt gần đây sẽ hiện ở đây sau lần chẩn đoán đầu tiên."
        />
      )}
    </Card>
  );
}
