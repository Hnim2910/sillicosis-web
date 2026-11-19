"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import type { Prediction } from "@/types/prediction";
import { predictionOutcome, predictionService } from "@/services/predictionService";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessage, formatDate, searchText } from "@/utils/format";
import { Card } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { Alert, EmptyState, ErrorState } from "@/components/common/Feedback";
import { Modal } from "@/components/common/Modal";
import { Pagination } from "@/components/common/Pagination";
import { useToast } from "@/components/common/Toast";
import { HistoryFilters } from "./HistoryFilters";
import { HistoryTable, NoMatchSkeleton } from "./HistoryTable";

const PAGE_SIZE = 10;

/**
 * Patient: own screenings. Admin: every screening; with `manage` they can also be deleted. The page itself never
 * scrolls: only the table body does, between its fixed header and the pagination footer.
 */
export function PredictionHistory({ manage = false }: { manage?: boolean }) {
  const { user } = useAuth();
  const toast = useToast();
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
  const shown = dateError
    ? []
    : records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="table-page">
      <PageHeader
        title={manage ? "Quản lý bản ghi" : "Lịch sử chẩn đoán"}
        action={
          !admin && (
            <Link href="/prediction" className="btn btn-primary">
              <ScanLine size={16} />
              Chẩn đoán mới
            </Link>
          )
        }
      />
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
        onClear={() => {
          setQuery("");
          setLabel("");
          setFrom("");
          setTo("");
          setPage(1);
        }}
        dateError={dateError}
      />
      <Card className="table-card">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : !shown.length ? (
          data?.length ? (
            <div className="table-card__body">
              <NoMatchSkeleton showPatient={admin} />
            </div>
          ) : (
            <EmptyState
              title="Chưa có lượt chẩn đoán nào"
              description="Các lượt chẩn đoán của bạn sẽ hiện ở đây."
            />
          )
        ) : (
          <div className="table-card__body">
            <HistoryTable
              records={shown}
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
          </div>
        )}
        <Pagination
          page={currentPage}
          pages={pages}
          total={dateError ? 0 : records.length}
          onPage={setPage}
        />
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
                  toast({ tone: "success", message: "Đã xoá lượt chẩn đoán khỏi lịch sử." });
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
    </div>
  );
}
