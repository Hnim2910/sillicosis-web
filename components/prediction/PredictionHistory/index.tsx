"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Visit } from "@/types/visit";
import { visitOutcome, visitService } from "@/services/visitService";
import { patientService } from "@/services/patientService";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage, formatDate, searchText } from "@/utils/format";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { HistoryFilters } from "./HistoryFilters";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { Alert, EmptyState, ErrorState } from "@/components/common/Feedback";
import { Modal } from "@/components/common/Modal";
import { HistoryTable } from "./HistoryTable";

export function PredictionHistory({
  patientId,
  manage = false,
  embedded = false,
}: {
  patientId?: string;
  manage?: boolean;
  embedded?: boolean;
}) {
  const { user } = useAuth();
  const role = user?.role;
  const loader = useCallback(async () => {
    if (patientId) return visitService.listForPatient(patientId);
    if (role === "admin") return visitService.listAll();
    return visitService.listForPatient((await patientService.getMine()).id);
  }, [patientId, role]);
  const { data, loading, error, reload } = useAsync(loader);
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [remove, setRemove] = useState<Visit | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [mutationError, setMutationError] = useState("");
  const dateError = !!from && !!to && from > to;
  const records = (data || []).filter(
    (visit) =>
      searchText(`${visit.patient.fullName} ${visit.patient.code}`).includes(searchText(query)) &&
      (!label || visitOutcome(visit) === label) &&
      (!from || visit.visitDate >= from) &&
      (!to || visit.visitDate <= to),
  );
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
              ? "Tra cứu và xoá lượt khám của mọi bệnh nhân."
              : "Xem lại kết quả và theo dõi các lượt khám theo thời gian."
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
          title={embedded ? "Lượt khám của bệnh nhân" : "Các lượt khám"}
          description={`${data?.length || 0} lượt khám · Mới nhất trước`}
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
            showPatient={!embedded && user?.role === "admin"}
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
      <Modal
        open={!!remove}
        title="Xoá lượt khám?"
        onClose={() => {
          if (!busy) setRemove(null);
        }}
      >
        <div className="stack">
          {mutationError && <Alert>{mutationError}</Alert>}
          <p>
            Lượt khám ngày <strong>{remove && formatDate(remove.visitDate)}</strong> của{" "}
            <strong>{remove?.patient.fullName}</strong> sẽ bị xoá cùng kết quả dự đoán. Ảnh X-quang
            và hồ sơ bệnh nhân vẫn được giữ lại.
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
                  await visitService.remove(remove.id);
                  setRemove(null);
                  setMessage("Đã xoá lượt khám.");
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
