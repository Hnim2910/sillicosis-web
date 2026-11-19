import Link from "next/link";
import { Eye, SearchX, Trash2 } from "lucide-react";
import type { Prediction } from "@/types/prediction";
import { predictionOutcome } from "@/services/predictionService";
import { OUTCOME_LABELS, OUTCOME_TONES } from "@/constants/app";
import { Badge } from "@/components/common/Badge";
import { formatDate } from "@/utils/format";
import { formatChance, mainChance } from "@/utils/predictionDisplay";

/**
 * Screenings table: Ngày khám, Tỷ lệ rủi ro, Nhãn rủi ro, Có phim X-quang, Thời gian tạo, Hành động (plus the
 * patient first in admin lists). The header stays visible while the body scrolls inside its container.
 */
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
    <table className="data-table">
      <caption className="sr-only">Lịch sử chẩn đoán</caption>
      <thead>
        <tr>
          {showPatient && <th>Bệnh nhân</th>}
          <th>Ngày khám</th>
          <th className="num">Tỷ lệ rủi ro mắc bệnh</th>
          <th>Nhãn rủi ro</th>
          <th className="center">Có phim X-quang</th>
          <th>Thời gian tạo</th>
          <th className="center action">Hành động</th>
        </tr>
      </thead>
      <tbody>
        {records.map((prediction) => {
          const outcome = predictionOutcome(prediction);
          const chance = mainChance(prediction);
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
              <td className="num">
                {chance === null ? (
                  <span className="muted-dash">—</span>
                ) : (
                  <strong>{formatChance(chance)}</strong>
                )}
              </td>
              <td>
                <Badge tone={OUTCOME_TONES[outcome]}>{OUTCOME_LABELS[outcome]}</Badge>
              </td>
              <td className="center">{prediction.image ? "Có" : "Không"}</td>
              <td>{formatDate(prediction.createdAt, true)}</td>
              <td className="center action">
                <div className="row-actions">
                  <Link
                    href={`/history/${prediction.id}`}
                    className="icon-action"
                    aria-label={`Xem lượt chẩn đoán ngày ${day}`}
                    title="Xem chi tiết"
                  >
                    <Eye size={17} />
                  </Link>
                  {onDelete && (
                    <button
                      type="button"
                      className="icon-action is-danger"
                      aria-label={`Xoá lượt chẩn đoán ngày ${day}`}
                      title="Xoá"
                      onClick={() => onDelete(prediction)}
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const COLUMNS = [
  "Ngày khám",
  "Tỷ lệ rủi ro mắc bệnh",
  "Nhãn rủi ro",
  "Có phim X-quang",
  "Thời gian tạo",
  "Hành động",
];

/** No record matches the filters: the table outline with placeholder rows and the message over them. */
export function NoMatchSkeleton({ showPatient }: { showPatient: boolean }) {
  const columns = [...(showPatient ? ["Bệnh nhân"] : []), ...COLUMNS];
  return (
    <div className="no-match">
      <table className="data-table" aria-hidden="true">
        <thead>
          <tr>
            {columns.map((name) => (
              <th key={name}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, row) => (
            <tr key={row}>
              {columns.map((name, column) => (
                <td key={name}>
                  <span
                    className="skeleton-bar"
                    style={{ width: `${45 + ((row * 3 + column * 7) % 5) * 10}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="no-match__message" role="status">
        <SearchX size={28} />
        <strong>Không tìm thấy kết quả tìm kiếm</strong>
        <span>Thử thay đổi điều kiện lọc hoặc bấm “Xoá bộ lọc”.</span>
      </div>
    </div>
  );
}
