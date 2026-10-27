import Link from "next/link";
import { ArrowUpRight, Trash2 } from "lucide-react";
import type { Visit, VisitOutcome } from "@/types/visit";
import { visitOutcome } from "@/services/visitService";
import { OUTCOME_LABELS } from "@/constants/app";
import { Table } from "@/components/common/Table";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { formatDate } from "@/utils/format";
import { formatPercent } from "@/utils/visitDisplay";

export const OUTCOME_TONES: Record<VisitOutcome, "warning" | "success" | "danger" | "neutral"> = {
  Co: "warning",
  Khong: "success",
  FAILED: "danger",
  NONE: "neutral",
};

export function HistoryTable({
  records,
  showPatient,
  onDelete,
}: {
  records: Visit[];
  showPatient: boolean;
  onDelete?: (record: Visit) => void;
}) {
  return (
    <Table
      caption="Lịch sử lượt khám"
      headers={[
        ...(showPatient ? ["Bệnh nhân"] : []),
        "Ngày khám",
        "Kết quả AI",
        "Xác suất",
        "Thời gian dự đoán",
        "Thao tác",
      ]}
    >
      {records.map((visit) => {
        const outcome = visitOutcome(visit);
        const prediction = visit.latestPrediction;
        const day = formatDate(visit.visitDate);
        return (
          <tr key={visit.id}>
            {showPatient && (
              <td>
                <div className="cell-person">
                  <div>
                    <strong>{visit.patient.fullName}</strong>
                    <small>{visit.patient.code}</small>
                  </div>
                </div>
              </td>
            )}
            <td>{day}</td>
            <td>
              <Badge tone={OUTCOME_TONES[outcome]}>
                {visit.image || outcome !== "NONE" ? OUTCOME_LABELS[outcome] : "Chưa có ảnh"}
              </Badge>
            </td>
            <td>
              <span className="font-semibold text-slate-600">
                {prediction?.status === "SUCCESS" && prediction.probability !== null
                  ? formatPercent(prediction.probability)
                  : "—"}
              </span>
            </td>
            <td>{prediction ? formatDate(prediction.createdAt, true) : "—"}</td>
            <td>
              <div className="flex items-center gap-1">
                <Link
                  href={`/history/${visit.id}`}
                  aria-label={`Xem lượt khám ngày ${day}`}
                  className="btn btn-ghost"
                >
                  <ArrowUpRight size={16} />
                </Link>
                {onDelete && (
                  <Button
                    variant="ghost"
                    aria-label={`Xoá lượt khám ngày ${day}`}
                    onClick={() => onDelete(visit)}
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
