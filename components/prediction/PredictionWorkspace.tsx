"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import { patientService } from "@/services/patientService";
import { imageService } from "@/services/imageService";
import type { LocalImage } from "@/services/imageService";
import { visitService } from "@/services/visitService";
import { ApiError } from "@/lib/apiClient";
import { useAsync } from "@/hooks/useAsync";
import type { Patient } from "@/types/patient";
import { MODEL_SCOPE_NOTICE } from "@/constants/app";
import {
  clinicalServerErrors,
  emptyClinicalDraft,
  hasClinicalValue,
  toLamSang,
  validateClinicalDraft,
} from "@/utils/clinicalForm";
import { errorMessage, today } from "@/utils/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Alert, ErrorState } from "@/components/common/Feedback";
import { Loading } from "@/components/common/Loading";
import { XrayUpload } from "@/components/prediction/XrayUpload";
import { ClinicalFields } from "@/components/prediction/ClinicalFields";
import { ClinicalImport } from "@/components/prediction/ClinicalImport";
import type { ClinicalDraft } from "@/utils/clinicalForm";

type Errors = Record<string, string>;

function dateError(value: string): Errors {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= today()
    ? {}
    : { visitDate: "Ngày khám không hợp lệ hoặc ở tương lai." };
}

function PredictionForm({ patient }: { patient: Patient }) {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [visitDate, setVisitDate] = useState(today);
  const [draft, setDraft] = useState(emptyClinicalDraft);
  const [serverErrors, setServerErrors] = useState<Errors>({});
  // Fields whose value in an imported file could not be read; cleared field by field as the user edits them.
  const [importErrors, setImportErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const localErrors = { ...dateError(visitDate), ...validateClinicalDraft(draft) };
  const errors = { ...importErrors, ...serverErrors, ...localErrors };
  const hasClinical = hasClinicalValue(draft);
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
      const imageId = image ? await imageService.upload(image.file) : null;
      const visit = await visitService.create(patient.id, {
        visitDate,
        extra: { lam_sang: toLamSang(draft) },
        imageId,
      });
      router.push(`/prediction/${visit.id}`);
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "IMAGE_ALREADY_ATTACHED")
        setError("Ảnh này đã được dùng cho một lượt khám trước. Mỗi lượt khám cần một ảnh riêng.");
      else setError(errorMessage(reason));
      if (reason instanceof ApiError) {
        const fields = reason.fieldErrors as Errors;
        setServerErrors({
          ...clinicalServerErrors(fields),
          ...(fields.visitDate ? { visitDate: fields.visitDate } : {}),
        });
      }
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="steps">
        <div className="step active">
          <span>1</span>Thông tin lâm sàng
        </div>
        <div className="step-divider" />
        <div className={`step ${image ? "active" : ""}`}>
          <span>2</span>Ảnh X-quang (không bắt buộc)
        </div>
        <div className="step-divider" />
        <div className={`step ${valid ? "active" : ""}`}>
          <span>3</span>Phân tích & kết quả
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
      <div className="prediction-grid">
        <div className="stack">
          <Card>
            <CardHeader
              title="Ảnh X-quang ngực (không bắt buộc)"
              description={`${patient.name} · ${patient.code}`}
            />
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
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={confirmed}
                    disabled={busy}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  <span>
                    Đây là phim X-quang ngực thẳng
                    {!confirmed && (
                      <small className="block field-error">
                        Cần xác nhận trước khi gửi ảnh cho mô hình.
                      </small>
                    )}
                  </span>
                </label>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Thực hiện dự đoán"
              description="Thông tin, ảnh và kết quả được lưu vào lịch sử lượt khám."
            />
            <div className="card-body stack">
              <Alert tone="info">{MODEL_SCOPE_NOTICE}</Alert>
              {!image && !hasClinical && (
                <p className="notice">Nhập ít nhất một thông tin lâm sàng hoặc chọn một ảnh.</p>
              )}
              <Button disabled={!valid} busy={busy} className="w-full" onClick={submit}>
                <ScanLine size={18} />
                {busy ? "Đang phân tích…" : "Lưu lượt khám & dự đoán"}
              </Button>
              {busy && (
                <p role="status" className="notice">
                  {image ? "Đang tải ảnh lên và chờ" : "Đang chờ"} mô hình phân tích, có thể mất
                  tới 30 giây…
                </p>
              )}
            </div>
          </Card>
        </div>
        <Card>
          <CardHeader
            title="Thông tin lâm sàng"
            description="Không bắt buộc ô nào. Mô hình dùng các thông tin này; ô để trống được xem là chưa ghi nhận."
          />
          <div className="card-body stack">
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
              visitDate={visitDate}
              onVisitDateChange={(value) => {
                setVisitDate(value);
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
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

export function PredictionWorkspace() {
  const { data, loading, error, reload } = useAsync(patientService.getMine);
  return (
    <>
      <PageHeader
        title="Dự đoán mới"
        description="Nhập thông tin lâm sàng, có thể kèm ảnh X-quang ngực, để mô hình thử nghiệm sàng lọc bụi phổi silic."
      />
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState
          message={error || "Không tìm thấy hồ sơ bệnh nhân của tài khoản."}
          retry={reload}
        />
      ) : (
        <PredictionForm patient={data} />
      )}
    </>
  );
}
