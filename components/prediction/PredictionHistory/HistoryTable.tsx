import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import type { Patient } from "@/types/patient";
import type { Prediction } from "@/types/prediction";
import { Table } from "@/components/common/Table";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { formatDate } from "@/utils/format";

export function HistoryTable({
  records,
  patients,
  onEdit,
  onDelete,
}: {
  records: Prediction[];
  patients: Patient[];
  onEdit?: (record: Prediction) => void;
  onDelete?: (record: Prediction) => void;
}) {
  return (
    <Table
      caption="Lịch sử dự đoán"
      headers={[
        "Bệnh nhân / bản ghi",
        "Thời gian",
        "Kết quả AI",
        "Độ tin cậy",
        "Đánh giá",
        "Thao tác",
      ]}
    >
      {records.map((record) => (
        <tr key={record.id}>
          <td>
            <div className="cell-person">
              <Image
                src={record.image.url}
                alt={`Ảnh của bản ghi ${record.id}`}
                width={34}
                height={39}
                unoptimized
                className="rounded-md bg-slate-900 object-cover"
              />
              <div>
                <strong>
                  {patients.find((patient) => patient.id === record.patientId)?.name ||
                    record.patientId}
                </strong>
                <small>{record.id}</small>
              </div>
            </div>
          </td>
          <td>{formatDate(record.createdAt, true)}</td>
          <td>
            <Badge tone={record.label === "Normal" ? "success" : "warning"}>{record.label}</Badge>
          </td>
          <td>
            <span className="font-semibold text-slate-600">{record.confidence.toFixed(1)}%</span>
          </td>
          <td>
            <Badge tone={record.review ? "blue" : "neutral"}>
              {record.review ? "Đã đánh giá" : "Chờ đánh giá"}
            </Badge>
          </td>
          <td>
            <div className="flex items-center gap-1">
              <Link
                href={`/history/${record.id}`}
                aria-label={`Xem kết quả ${record.id}`}
                className="btn btn-ghost"
              >
                <ArrowUpRight size={16} />
              </Link>
              {onEdit && (
                <Button
                  variant="ghost"
                  aria-label={`Sửa bản ghi ${record.id}`}
                  onClick={() => onEdit(record)}
                >
                  <Pencil size={15} />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  aria-label={`Xóa bản ghi ${record.id}`}
                  onClick={() => onDelete(record)}
                >
                  <Trash2 size={15} />
                </Button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </Table>
  );
}
