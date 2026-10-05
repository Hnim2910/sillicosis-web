"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prediction } from "@/types/prediction";
import { predictionService } from "@/services/predictionService";
import { patientService } from "@/services/patientService";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage, searchText } from "@/utils/format";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { HistoryFilters } from "./HistoryFilters";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { Alert, EmptyState, ErrorState } from "@/components/common/Feedback";
import { Modal } from "@/components/common/Modal";
import { HistoryTable } from "./HistoryTable";
import { RecordEditor } from "@/components/admin/RecordEditor";

export function PredictionHistory({
  patientId,
  manage = false,
  embedded = false,
}: {
  patientId?: string;
  manage?: boolean;
  embedded?: boolean;
}) {
  const loader = useCallback(
    async () => ({
      records: await predictionService.list(patientId),
      patients: await patientService.getPatients(),
    }),
    [patientId],
  );
  const { data, loading, error, reload } = useAsync(loader);
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<Prediction | null>(null);
  const [remove, setRemove] = useState<Prediction | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [mutationError, setMutationError] = useState("");
  const dateError = !!from && !!to && from > to;
  const records = (data?.records || []).filter((record) => {
    const name = data?.patients.find((patient) => patient.id === record.patientId)?.name || "";
    const date = new Date(record.createdAt).toLocaleDateString("en-CA");
    return (
      searchText(`${name} ${record.id} ${record.patientId}`).includes(searchText(query)) &&
      (!label || record.label === label) &&
      (!from || date >= from) &&
      (!to || date <= to)
    );
  });
  const pages = Math.max(1, Math.ceil(records.length / 8));
  const currentPage = Math.min(page, pages);
  const admin = manage && user?.role === "admin";
  return (
    <>
      {!embedded && (
        <PageHeader
          title={manage ? "Quản lý bản ghi" : "Lịch sử dự đoán"}
          description={
            manage
              ? "Tra cứu, bổ sung ghi chú và đánh giá dữ liệu mô hình."
              : "Xem lại kết quả và theo dõi các lần sàng lọc theo thời gian."
          }
          action={
            user?.role !== "admin" && (
              <Link href="/prediction" className="btn btn-primary">
                <Plus size={16} />
                Dự đoán mới
              </Link>
            )
          }
        />
      )}
      {message && (
        <div className="mb-4">
          <Alert tone="success">{message}</Alert>
        </div>
      )}
      <Card>
        <CardHeader
          title={embedded ? "Lịch sử của bệnh nhân" : "Các lần phân tích"}
          description={`${data?.records.length || 0} bản ghi · Sắp xếp mới nhất trước`}
        />
        <HistoryFilters
          query={query}
          label={label}
          from={from}
          to={to}
          onQuery={(value) => {
            setQuery(value);
            setPage(1);
          }}
          onLabel={(value) => {
            setLabel(value);
            setPage(1);
          }}
          onFrom={(value) => {
            setFrom(value);
            setPage(1);
          }}
          onTo={(value) => {
            setTo(value);
            setPage(1);
          }}
        />
        {dateError && (
          <div className="px-6 pb-4">
            <Alert>Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</Alert>
          </div>
        )}
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : !records.length || dateError ? (
          <EmptyState
            title="Không có bản ghi phù hợp"
            description="Thử thay đổi bộ lọc hoặc thực hiện một lần dự đoán mới."
          />
        ) : (
          <HistoryTable
            records={records.slice((currentPage - 1) * 8, currentPage * 8)}
            patients={data?.patients || []}
            onEdit={admin ? setEdit : undefined}
            onDelete={
              admin
                ? (record) => {
                    setRemove(record);
                    setMutationError("");
                  }
                : undefined
            }
          />
        )}
        <div className="table-footer">
          <span>
            {records.length} bản ghi · Trang {currentPage}/{pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Trước
            </Button>
            <Button
              variant="secondary"
              disabled={currentPage >= pages}
              onClick={() => setPage(currentPage + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </Card>
      <Modal open={!!edit} title="Cập nhật bản ghi" onClose={() => setEdit(null)}>
        {edit && (
          <RecordEditor
            record={edit}
            onSaved={() => {
              setEdit(null);
              setMessage("Đã cập nhật bản ghi.");
              void reload();
            }}
          />
        )}
      </Modal>
      <Modal
        open={!!remove}
        title="Xóa bản ghi dự đoán?"
        onClose={() => {
          if (!busy) setRemove(null);
        }}
      >
        <div className="stack">
          {mutationError && <Alert>{mutationError}</Alert>}
          <p>
            Bản ghi <strong>{remove?.id}</strong> và ảnh liên quan sẽ được xóa khỏi dữ liệu demo. Hồ
            sơ bệnh nhân vẫn được giữ lại.
          </p>
          <div className="form-actions">
            <Button variant="secondary" disabled={busy} onClick={() => setRemove(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              busy={busy}
              onClick={async () => {
                if (!remove) return;
                setBusy(true);
                setMutationError("");
                try {
                  await predictionService.remove(remove.id);
                  setRemove(null);
                  setMessage("Đã xóa bản ghi và ảnh liên quan.");
                  void reload();
                } catch (reason) {
                  setMutationError(errorMessage(reason));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
