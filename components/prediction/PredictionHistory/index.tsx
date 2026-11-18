"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prediction } from "@/types/prediction";
import { predictionOutcome, predictionService } from "@/services/predictionService";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage, formatDate, searchText } from "@/utils/format";
import { Card } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { HistoryFilters } from "./HistoryFilters";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { Alert, EmptyState, ErrorState } from "@/components/common/Feedback";
import { Modal } from "@/components/common/Modal";
import { HistoryTable } from "./HistoryTable";

const PAGE_SIZE = 8;

/** Patient: own screenings. Admin: every screening; with `manage` they can also be deleted. */
export function PredictionHistory({ manage = false }: { manage?: boolean }) {
  const { user } = useAuth();
  const admin = user?.role === "admin";
  const loader = useCallback(
    () => (admin ? predictionService.listAll() : predictionService.listMine()),
    [admin],
  );
  const { data, loading, error, reload } = useAsync(loader);
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [remove, setRemove] = useState<Prediction | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [mutationError, setMutationError] = useState("");
  const dateError = !!from && !!to && from > to;
  const records = (data || []).filter(
    (prediction) =>
      (!admin ||
        searchText(`${prediction.user?.fullName ?? ""} ${prediction.user?.code ?? ""}`).includes(
          searchText(query),
        )) &&
      (!label || predictionOutcome(prediction) === label) &&
      (!from || prediction.examDate >= from) &&
      (!to || prediction.examDate <= to),
  );
  const pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const resetPage =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };
  return (
    <>
      <PageHeader
        title={manage ? "Quản lý bản ghi" : "Lịch sử dự đoán"}
        action={
          !admin && (
            <Link href="/prediction" className="btn btn-primary">
              <Plus size={16} />
              Dự đoán mới
            </Link>
          )
        }
      />
      {message && (
        <div className="mb-4">
          <Alert tone="success">{message}</Alert>
        </div>
      )}
      <Card>
        <HistoryFilters
          showSearch={admin}
          query={query}
          label={label}
          from={from}
          to={to}
          onQuery={resetPage(setQuery)}
          onLabel={resetPage(setLabel)}
          onFrom={resetPage(setFrom)}
          onTo={resetPage(setTo)}
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
            title={data?.length ? "Không có bản ghi phù hợp" : "Chưa có lượt chẩn đoán nào"}
            description={data?.length ? "Thử thay đổi bộ lọc." : undefined}
          />
        ) : (
          <HistoryTable
            records={records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)}
            showPatient={admin}
            onDelete={
              manage && admin
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
        title="Xoá lượt chẩn đoán?"
        onClose={() => {
          if (!busy) setRemove(null);
        }}
      >
        <div className="stack">
          {mutationError && <Alert>{mutationError}</Alert>}
          <p>
            Lượt chẩn đoán ngày <strong>{remove && formatDate(remove.examDate)}</strong> của{" "}
            <strong>{remove?.user?.fullName}</strong> sẽ bị xoá khỏi lịch sử.
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
                  setMessage("Đã xoá lượt chẩn đoán.");
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
