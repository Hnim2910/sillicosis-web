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
import type { VisitClinical } from "@/types/visit";
import { MODEL_SCOPE_NOTICE } from "@/constants/app";
import { emptyVisitDraft, toVisitClinical, validateVisitDraft } from "@/utils/visitForm";
import { errorMessage } from "@/utils/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Alert, ErrorState } from "@/components/common/Feedback";
import { Loading } from "@/components/common/Loading";
import { XrayUpload } from "@/components/prediction/XrayUpload";
import { VisitFields } from "@/components/prediction/VisitFields";

type Errors = Partial<Record<keyof VisitClinical, string>>;

function PredictionForm({ patient }: { patient: Patient }) {
  const [image, setImage] = useState<LocalImage | null>(null);
  const [draft, setDraft] = useState(emptyVisitDraft);
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const errors = { ...serverErrors, ...validateVisitDraft(draft) };
  const valid = !!image && !Object.keys(validateVisitDraft(draft)).length;

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  async function submit() {
    if (!image) return;
    setBusy(true);
    setError("");
    setServerErrors({});
    try {
      const imageId = await imageService.upload(image.file);
      const visit = await visitService.create(patient.id, { ...toVisitClinical(draft), imageId });
      router.push(`/prediction/${visit.id}`);
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "IMAGE_ALREADY_ATTACHED")
        setError("Ảnh này đã được dùng cho một lượt khám trước. Mỗi lượt khám cần một ảnh riêng.");
      else setError(errorMessage(reason));
      if (reason instanceof ApiError) setServerErrors(reason.fieldErrors as Errors);
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="steps">
        <div className="step active">
          <span>1</span>Ảnh X-quang
        </div>
        <div className="step-divider" />
        <div className={`step ${image ? "active" : ""}`}>
          <span>2</span>Thông tin lượt khám
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
              title="Ảnh X-quang ngực"
              description={`${patient.name} · ${patient.code}`}
            />
            <div className="card-body">
              <XrayUpload value={image} onChange={setImage} disabled={busy} />
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Thực hiện dự đoán"
              description="Ảnh, chỉ số và kết quả được lưu vào lịch sử lượt khám."
            />
            <div className="card-body stack">
              <Alert tone="info">{MODEL_SCOPE_NOTICE}</Alert>
              <Button disabled={!valid} busy={busy} className="w-full" onClick={submit}>
                <ScanLine size={18} />
                {busy ? "Đang phân tích ảnh…" : "Lưu lượt khám & dự đoán"}
              </Button>
              {busy && (
                <p role="status" className="notice">
                  Đang tải ảnh lên và chờ mô hình phân tích, có thể mất tới 30 giây…
                </p>
              )}
            </div>
          </Card>
        </div>
        <Card>
          <CardHeader
            title="Thông tin lượt khám"
            description="Không bắt buộc. Các chỉ số được lưu cùng lượt khám để theo dõi, mô hình không dùng chúng."
          />
          <div className="card-body">
            <VisitFields
              value={draft}
              onChange={(value) => {
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
        description="Tải ảnh X-quang ngực để mô hình thử nghiệm sàng lọc bụi phổi silic."
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
