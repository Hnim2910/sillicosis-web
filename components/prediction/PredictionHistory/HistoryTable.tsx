import Link from "next/link";
import { ArrowUpRight, Trash2 } from "lucide-react";
import type { Prediction, PredictionOutcome } from "@/types/prediction";
import { predictionOutcome } from "@/services/predictionService";
import { OUTCOME_LABELS } from "@/constants/app";
import { Table } from "@/components/common/Table";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { formatDate } from "@/utils/format";
import { shortResult } from "@/utils/predictionDisplay";

export const OUTCOME_TONES: Record<PredictionOutcome, "warning" | "success" | "danger"> = {
  Co: "warning",
  Khong: "success",
  FAILED: "danger",
};

export function HistoryTable({
  records,
  showPatient,
  onDelete,
}: {
  records: Prediction[];
  showPatient: boolean;
  onDelete?: (record: Prediction) => void;
}) {
  return (
    <Table
      caption="Lịch sử chẩn đoán"
      headers={[
        ...(showPatient ? ["Bệnh nhân"] : []),
        "Ngày khám",
        "Kết quả AI",
        "Khả năng",
        "Ảnh",
        "Thao tác",
      ]}
    >
      {records.map((prediction) => {
        const outcome = predictionOutcome(prediction);
        const day = formatDate(prediction.examDate);
        return (
          <tr key={prediction.id}>
            {showPatient && (
              <td>
                <div className="cell-person">
                  <div>
                    <strong>{prediction.user?.fullName}</strong>
                    <small>{prediction.user?.code}</small>
                  </div>
                </div>
              </td>
            )}
            <td>{day}</td>
            <td>
              <Badge tone={OUTCOME_TONES[outcome]}>{OUTCOME_LABELS[outcome]}</Badge>
            </td>
            <td>
              <span className="font-semibold text-slate-700">
                {prediction.status === "SUCCESS" ? shortResult(prediction) : "—"}
              </span>
            </td>
            <td>{prediction.image ? "Có" : "Không"}</td>
            <td>
              <div className="flex items-center gap-1">
                <Link
                  href={`/history/${prediction.id}`}
                  aria-label={`Xem lượt chẩn đoán ngày ${day}`}
                  className="btn btn-ghost"
                >
                  <ArrowUpRight size={16} />
                </Link>
                {onDelete && (
                  <Button
                    variant="ghost"
                    aria-label={`Xoá lượt chẩn đoán ngày ${day}`}
                    onClick={() => onDelete(prediction)}
                  >
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </Table>
  );
}
