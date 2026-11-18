"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { LocalImage } from "@/services/imageService";
import { predictionService } from "@/services/predictionService";
import { ApiError } from "@/lib/apiClient";
import type { User } from "@/types/user";
import { GENDER_LABELS, MODEL_SCOPE_NOTICE } from "@/constants/app";
import {
  clinicalServerErrors,
  emptyClinicalDraft,
  hasClinicalValue,
  toLamSang,
  validateClinicalDraft,
} from "@/utils/clinicalForm";
import type { ClinicalDraft } from "@/utils/clinicalForm";
import { errorMessage, today } from "@/utils/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { Loading } from "@/components/common/Loading";
import { XrayUpload } from "@/components/prediction/XrayUpload";
import { ClinicalFields } from "@/components/prediction/ClinicalFields";
import { ClinicalImport } from "@/components/prediction/ClinicalImport";

type Errors = Record<string, string>;

function dateError(value: string, birthDate: string): Errors {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today())
    return { examDate: "Ngày khám không hợp lệ hoặc ở tương lai." };
  if (birthDate && value < birthDate) return { examDate: "Ngày khám không được trước ngày sinh." };
  return {};
}

/** Gender and birth year come from the profile (the backend copies them in); only asked when missing there. */
function profileKeys(user: User) {
  const keys: string[] = [];
  if (user.gender === "male" || user.gender === "female") keys.push("gioitinh");
  if (user.birthDate) keys.push("namsinh");
  return keys;
}

function PredictionForm({ user }: { user: User }) {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [examDate, setExamDate] = useState(today);
  // The current job is pre-filled from the profile; the model reads it as free text.
  const [draft, setDraft] = useState<ClinicalDraft>(() => ({
    ...emptyClinicalDraft(),
    cviec: user.occupation,
  }));
  const [serverErrors, setServerErrors] = useState<Errors>({});
  // Fields whose value in an imported file could not be read; cleared field by field as the user edits them.
  const [importErrors, setImportErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const fromProfile = profileKeys(user);
  // Values taken from the profile are not sent: the backend fills them in.
  const sent = { ...draft, ...Object.fromEntries(fromProfile.map((key) => [key, ""])) };
  const localErrors = { ...dateError(examDate, user.birthDate), ...validateClinicalDraft(sent) };
  const errors = { ...importErrors, ...serverErrors, ...localErrors };
  const hasClinical = hasClinicalValue(sent);
  // Image optional; when one is chosen the user must confirm it is a frontal chest X-ray.
  const imageReady = !image || confirmed;
  const valid = (!!image || hasClinical) && imageReady && !Object.keys(localErrors).length;

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  async function submit() {
    if (!valid) return;
    setBusy(true);
    setError("");
    setServerErrors({});
    try {
      const prediction = await predictionService.create({
        examDate,
        lamSang: toLamSang(sent),
        image: image?.file ?? null,
      });
      router.push(`/prediction/${prediction.id}`);
    } catch (reason) {
      setError(errorMessage(reason));
      if (reason instanceof ApiError) {
        const fields = reason.fieldErrors as Errors;
        setServerErrors({
          ...clinicalServerErrors(fields),
          ...(fields.examDate ? { examDate: fields.examDate } : {}),
        });
      }
      setBusy(false);
    }
  }

  const profileNote = [
    fromProfile.includes("gioitinh") && `giới tính ${GENDER_LABELS[user.gender as "male" | "female"]}`,
    fromProfile.includes("namsinh") && `năm sinh ${user.birthDate.slice(0, 4)}`,
  ].filter(Boolean);

  return (
    <div className="stack">
      {error && <Alert>{error}</Alert>}
      <div className="prediction-grid">
        <div className="stack">
          <Card>
            <CardHeader title="Ảnh X-quang ngực" description="Không bắt buộc." />
            <div className="card-body stack">
              <XrayUpload
                value={image}
                onChange={(next) => {
                  setImage(next);
                  setConfirmed(false);
                }}
                disabled={busy}
              />
              {image && (
                <label className="prediction-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    disabled={busy}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  <span>
                    Đây là phim X-quang ngực thẳng
                    {!confirmed && (
                      <small className="block field-error">Cần xác nhận trước khi gửi.</small>
                    )}
                  </span>
                </label>
              )}
            </div>
          </Card>
          <Card>
            <div className="card-body stack">
              <Alert tone="info">{MODEL_SCOPE_NOTICE}</Alert>
              {!image && !hasClinical && (
                <p className="notice">Nhập ít nhất một thông tin lâm sàng hoặc chọn một ảnh.</p>
              )}
              <Button disabled={!valid} busy={busy} className="w-full" onClick={submit}>
                <ScanLine size={18} />
                {busy ? "Đang phân tích…" : "Chẩn đoán"}
              </Button>
              {busy && (
                <p role="status" className="notice">
                  Đang chờ mô hình phân tích, có thể mất tới 30 giây…
                </p>
              )}
            </div>
          </Card>
        </div>
        <Card className="clinical-panel">
          <CardHeader
            title="Thông tin lâm sàng"
            description="Không bắt buộc ô nào; ô để trống được xem là chưa ghi nhận."
          />
          <div className="card-body stack">
            {profileNote.length > 0 && (
              <p className="notice">
                Lấy từ hồ sơ: {profileNote.join(", ")}.{" "}
                <Link href="/profile" className="text-link">
                  Sửa hồ sơ
                </Link>
              </p>
            )}
            <ClinicalImport
              disabled={busy}
              onImport={(result) => {
                setDraft(result.draft);
                setServerErrors({});
                setImportErrors(
                  Object.fromEntries(
                    result.invalid.map((key) => [key, "Giá trị trong file không hợp lệ, hãy nhập lại."]),
                  ),
                );
              }}
            />
            <ClinicalFields
              examDate={examDate}
              onExamDateChange={(value) => {
                setExamDate(value);
                setServerErrors({});
              }}
              value={draft}
              onChange={(value: ClinicalDraft) => {
                setImportErrors((current) =>
                  Object.fromEntries(Object.entries(current).filter(([key]) => value[key] === draft[key])),
                );
                setDraft(value);
                setServerErrors({});
              }}
              errors={errors}
              disabled={busy}
              hiddenKeys={fromProfile}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export function PredictionWorkspace() {
  const { user } = useAuth();
  return (
    <div className="prediction-app">
      <PageHeader
        title="Dự đoán mới"
        description="Mỗi lần gửi được lưu thành một lượt chẩn đoán trong lịch sử."
      />
      {user ? <PredictionForm user={user} /> : <Loading />}
    </div>
  );
}
