"use client";
import { useState } from "react";
import type { Prediction, ReviewDecision } from "@/types/prediction";
import { REVIEW_LABELS } from "@/constants/app";
import { predictionService } from "@/services/predictionService";
import { Select, Textarea } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { errorMessage } from "@/utils/format";

export function MedicalReviewForm({
  record,
  onSaved,
}: {
  record: Prediction;
  onSaved: () => void;
}) {
  const [decision, setDecision] = useState<ReviewDecision>(record.review?.decision || "agree");
  const [note, setNote] = useState(record.review?.note || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
          await predictionService.review(record.id, decision, note);
          onSaved();
        } catch (reason) {
          setError(errorMessage(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      {error && <Alert>{error}</Alert>}
      <Select
        label="Đánh giá kết quả AI"
        value={decision}
        onChange={(event) => setDecision(event.target.value as ReviewDecision)}
      >
        {Object.entries(REVIEW_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Select>
      <Textarea
        label="Ghi chú / kết luận chuyên môn"
        required
        value={note}
        maxLength={4000}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Nhập nhận xét của bác sĩ…"
      />
      <Button type="submit" busy={busy} disabled={!note.trim()}>
        Lưu đánh giá
      </Button>
    </form>
  );
}
