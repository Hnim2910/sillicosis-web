"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Pencil, ScanLine } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { patientService } from "@/services/patientService";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { ErrorState } from "@/components/common/Feedback";
import { Modal } from "@/components/common/Modal";
import { PatientCard } from "@/components/patient/PatientCard";
import { PatientForm } from "@/components/patient/PatientForm";
import { PredictionHistory } from "@/components/prediction/PredictionHistory";

export function PatientDetail({ id }: { id: string }) {
  const loader = useCallback(() => patientService.getPatient(id), [id]);
  const { data, loading, error, reload } = useAsync(loader);
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  if (loading) return <Loading />;
  if (error || !data)
    return <ErrorState message={error || "Không tìm thấy bệnh nhân."} retry={reload} />;
  return (
    <>
      <PageHeader
        title={data.name}
        description={`Hồ sơ bệnh nhân · ${data.code}`}
        action={
          <>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil size={15} />
              Chỉnh sửa
            </Button>
            {user?.role !== "admin" && (
              <Link href="/prediction" className="btn btn-primary">
                <ScanLine size={16} />
                Lượt khám mới
              </Link>
            )}
          </>
        }
      />
      <div className="stack">
        <PatientCard patient={data} />
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
