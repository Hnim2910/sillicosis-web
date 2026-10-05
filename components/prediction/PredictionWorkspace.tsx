"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import { patientService } from "@/services/patientService";
import { predictionService } from "@/services/predictionService";
import { useAsync } from "@/hooks/useAsync";
import type { Patient, ClinicalRecord } from "@/types/patient";
import type { PredictionScenario, XrayImage } from "@/types/prediction";
import { SCENARIO_LABELS } from "@/constants/app";
import { validateClinicalRecords } from "@/utils/validation";
import { errorMessage } from "@/utils/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Select } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Alert, EmptyState, ErrorState } from "@/components/common/Feedback";
import { Loading } from "@/components/common/Loading";
import { ClinicalRecords } from "@/components/patient/ClinicalRecords";
import { XrayUpload } from "@/components/prediction/XrayUpload";

function PredictionForm({
  patients,
  initialPatientId,
}: {
  patients: Patient[];
  initialPatientId?: string;
}) {
  const first = patients.find((patient) => patient.id === initialPatientId) || patients[0];
  const [patientId, setPatientId] = useState(first.id);
  const [records, setRecords] = useState<ClinicalRecord[]>(first.clinicalRecords);
  const [image, setImage] = useState<XrayImage | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [scenario, setScenario] = useState<PredictionScenario>("silicosis");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const valid = !!image && confirmed && !validateClinicalRecords(records);
  return (
    <div className="stack">
      <div className="steps">
        <div className="step active">
          <span>1</span>Ảnh X-quang
        </div>
        <div className="step-divider" />
        <div className={`step ${image ? "active" : ""}`}>
          <span>2</span>Dữ liệu theo dõi
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
              title="Thông tin bệnh nhân"
              description="Liên kết ảnh và kết quả với đúng hồ sơ."
            />
            <div className="card-body">
              <Select
                label="Chọn bệnh nhân"
                value={patientId}
                disabled={busy}
                onChange={(event) => {
                  const patient = patients.find((entry) => entry.id === event.target.value)!;
                  setPatientId(patient.id);
                  setRecords(patient.clinicalRecords);
                  setConfirmed(false);
                  setImage(null);
                  setError("");
                }}
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} · {patient.id}
                  </option>
                ))}
              </Select>
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Ảnh X-quang ngực"
              description="Chọn một ảnh để thực hiện sàng lọc."
            />
            <div className="card-body">
              <XrayUpload value={image} onChange={setImage} disabled={busy} />
            </div>
          </Card>
        </div>
        <div className="stack">
          <Card>
            <CardHeader
              title="Dữ liệu theo thời gian"
              description="Các mốc phơi nhiễm và chỉ số lâm sàng của bệnh nhân."
            />
            <div className="card-body">
              <ClinicalRecords
                value={records}
                disabled={busy}
                onChange={(value) => {
                  setRecords(value);
                  setConfirmed(false);
                }}
              />
              <label className="checkbox-label mt-5">
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={busy || !!validateClinicalRecords(records)}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                Tôi đã kiểm tra và xác nhận dữ liệu theo dõi.
              </label>
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Thực hiện dự đoán"
              description="Kết quả và dữ liệu đầu vào sẽ được lưu vào lịch sử."
            />
            <div className="card-body stack">
              <Select
                label="Kịch bản demo"
                value={scenario}
                disabled={busy}
                onChange={(event) => setScenario(event.target.value as PredictionScenario)}
              >
                {Object.entries(SCENARIO_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
              <p className="notice">
                Kết quả cố định theo kịch bản đã chọn, không phụ thuộc nội dung ảnh. Heatmap cũng
                chỉ là minh họa.
              </p>
              <Button
                disabled={!valid}
                busy={busy}
                className="w-full"
                onClick={async () => {
                  if (!image) return;
                  setBusy(true);
                  setError("");
                  try {
                    const result = await predictionService.predict({
                      patientId,
                      image,
                      clinicalRecords: records,
                      scenario,
                    });
                    router.push(`/prediction/${result.id}`);
                  } catch (reason) {
                    setError(errorMessage(reason));
                    setBusy(false);
                  }
                }}
              >
                <ScanLine size={18} />
                {busy ? "Đang mô phỏng phân tích…" : "Bắt đầu dự đoán"}
              </Button>
              {busy && (
                <p role="status" className="notice">
                  Đang mô phỏng kiểm tra ảnh, kết hợp dữ liệu và trả kết quả…
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function PredictionWorkspace({ patientId }: { patientId?: string }) {
  const { data, loading, error, reload } = useAsync(patientService.getPatients);
  return (
    <>
      <PageHeader
        title="Dự đoán mới"
        description="Kết hợp ảnh X-quang ngực và dữ liệu theo dõi để hỗ trợ sàng lọc."
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : data?.length ? (
        <PredictionForm patients={data} initialPatientId={patientId} />
      ) : (
        <EmptyState
          title="Chưa có hồ sơ bệnh nhân"
          description="Tạo hồ sơ bệnh nhân trước khi thực hiện dự đoán."
        />
      )}
    </>
  );
}
