"use client";
import { useState } from "react";
import type { Prediction } from "@/types/prediction";
import { predictionService } from "@/services/predictionService";
import { Button } from "@/components/common/Button";
import { Select, Textarea } from "@/components/common/Input";
import { Alert } from "@/components/common/Feedback";
import { errorMessage } from "@/utils/format";

export function RecordEditor({ record, onSaved }: { record: Prediction; onSaved: () => void }) {
  const [note, setNote] = useState(record.adminNote);
  const [evaluation, setEvaluation] = useState(record.evaluation);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
          await predictionService.updateRecord(record.id, note, evaluation);
          onSaved();
        } catch (reason) {
          setError(errorMessage(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <Alert>{error}</Alert>}
      <p className="notice">{record.id} · Nhãn và xác suất gốc của mô hình được giữ lại.</p>
      <Select
        label="Nhãn phục vụ đánh giá mô hình"
        value={evaluation}
        onChange={(event) => setEvaluation(event.target.value as Prediction["evaluation"])}
      >
        <option value="unreviewed">Chưa đánh giá</option>
        <option value="correct">Kết quả đúng</option>
        <option value="incorrect">Kết quả sai</option>
      </Select>
      <Textarea
        label="Ghi chú quản trị"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <Button type="submit" busy={busy}>
        Lưu cập nhật
      </Button>
    </form>
  );
}
