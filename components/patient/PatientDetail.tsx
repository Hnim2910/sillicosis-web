"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Pencil, ScanLine } from "lucide-react";
import type { Patient } from "@/types/patient";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { patientService } from "@/services/patientService";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Card, CardHeader } from "@/components/common/Card";
import { Loading } from "@/components/common/Loading";
import { Alert, ErrorState } from "@/components/common/Feedback";
import { Modal } from "@/components/common/Modal";
import { PatientCard } from "@/components/patient/PatientCard";
import { PatientForm } from "@/components/patient/PatientForm";
import { ClinicalRecords } from "@/components/patient/ClinicalRecords";
import { ClinicalTable } from "@/components/patient/ClinicalRecords/ClinicalTable";
import { PredictionHistory } from "@/components/prediction/PredictionHistory";
import { validateClinicalRecords } from "@/utils/validation";
import { errorMessage } from "@/utils/format";

export function PatientClinicalEditor({ patient }: { patient: Patient }) {
  const [records, setRecords] = useState(patient.clinicalRecords);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  return (
    <div className="stack">
      <ClinicalRecords
        value={records}
        disabled={busy}
        onChange={(value) => {
          setRecords(value);
          setSuccess(false);
        }}
      />
      {error && <Alert>{error}</Alert>}
      {success && <Alert tone="success">Đã lưu dữ liệu theo dõi vào hồ sơ.</Alert>}
      <div className="flex justify-end">
        <Button
          disabled={!!records.length && !!validateClinicalRecords(records)}
          busy={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await patientService.saveClinicalRecords(patient.id, records);
              setSuccess(true);
            } catch (reason) {
              setError(errorMessage(reason));
            } finally {
              setBusy(false);
            }
          }}
        >
          Lưu dữ liệu theo dõi
        </Button>
      </div>
    </div>
  );
}

export function PatientDetail({ id }: { id: string }) {
  const loader = useCallback(() => patientService.getPatient(id), [id]);
  const { data, loading, error, reload } = useAsync(loader);
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const editable = user?.role === "doctor" || user?.role === "technician";
  if (loading) return <Loading />;
  if (error || !data)
    return <ErrorState message={error || "Không tìm thấy bệnh nhân."} retry={reload} />;
  return (
    <>
      <PageHeader
        title={data.name}
        description={`Hồ sơ bệnh nhân · ${data.id}`}
        action={
          <>
            {editable && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <Pencil size={15} />
                Chỉnh sửa
              </Button>
            )}
            {user?.role !== "admin" && (
              <Link href={`/prediction?patient=${id}`} className="btn btn-primary">
                <ScanLine size={16} />
                Dự đoán mới
              </Link>
            )}
          </>
        }
      />
      <div className="detail-grid">
        <PatientCard patient={data} />
        <Card>
          <CardHeader
            title="Dữ liệu theo thời gian"
            description="Theo dõi phơi nhiễm và các chỉ số lâm sàng qua từng mốc."
          />
          <div className="card-body">
            {user?.role === "admin" ? (
              <ClinicalTable records={data.clinicalRecords} />
            ) : (
              <PatientClinicalEditor key={data.id} patient={data} />
            )}
          </div>
        </Card>
      </div>
      <div className="mt-6">
        <PredictionHistory patientId={id} embedded />
      </div>
      <Modal open={editing} title="Cập nhật hồ sơ bệnh nhân" onClose={() => setEditing(false)}>
        <PatientForm
          patient={data}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            void reload();
          }}
        />
      </Modal>
    </>
  );
}
