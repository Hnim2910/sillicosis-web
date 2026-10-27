"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { patientService } from "@/services/patientService";
import { ApiError } from "@/lib/apiClient";
import { ROLE_LABELS } from "@/constants/app";
import { PASSWORD_RULE } from "@/utils/validation";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Loading } from "@/components/common/Loading";
import { Modal } from "@/components/common/Modal";
import { ErrorState } from "@/components/common/Feedback";
import { PatientCard } from "@/components/patient/PatientCard";
import { PatientForm } from "@/components/patient/PatientForm";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

async function loadMine() {
  try {
    return await patientService.getMine();
  } catch (reason) {
    if (reason instanceof ApiError && reason.code === "PATIENT_NOT_FOUND") return null;
    throw reason;
  }
}

/** The patient record linked to this account (used for visits), separate from the account profile. */
function OwnPatientRecord() {
  const { data, loading, error, reload } = useAsync(loadMine);
  const [editing, setEditing] = useState(false);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={reload} />;
  if (!data)
    return (
      <Card>
        <CardHeader title="Hồ sơ bệnh nhân" />
        <div className="card-body">
          <p className="notice">Tài khoản này chưa được liên kết với hồ sơ bệnh nhân.</p>
        </div>
      </Card>
    );
  return (
    <>
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          <Pencil size={15} />
          Cập nhật hồ sơ bệnh nhân
        </Button>
      </div>
      <PatientCard patient={data} />
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

export function ProfileOverview() {
  const { user } = useAuth();
  if (!user) return <Loading />;
  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        description={`${ROLE_LABELS[user.role]} · Quản lý thông tin và mật khẩu của bạn.`}
      />
      <div className="stack">
        <div className="prediction-grid">
          <Card>
            <CardHeader
              title="Thông tin tài khoản"
              description="Cập nhật thông tin liên hệ và nghề nghiệp."
            />
            <div className="card-body">
              <ProfileForm user={user} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Đổi mật khẩu" description={`Mật khẩu mới gồm ${PASSWORD_RULE}`} />
            <div className="card-body">
              <PasswordForm />
            </div>
          </Card>
        </div>
        {user.role === "patient" && <OwnPatientRecord />}
      </div>
    </>
  );
}
