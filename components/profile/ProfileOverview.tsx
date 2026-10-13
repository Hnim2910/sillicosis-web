"use client";
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAsync } from "@/hooks/useAsync";
import { patientService } from "@/services/patientService";
import { ROLE_LABELS } from "@/constants/app";
import { PASSWORD_RULE } from "@/utils/validation";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Loading } from "@/components/common/Loading";
import { ErrorState } from "@/components/common/Feedback";
import { PatientClinicalEditor } from "@/components/patient/PatientDetail";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

function OwnClinicalRecords({ patientId }: { patientId: string }) {
  const loader = useCallback(() => patientService.getPatient(patientId), [patientId]);
  const { data, loading, error, reload } = useAsync(loader);
  return (
    <Card>
      <CardHeader
        title="Dữ liệu theo dõi của tôi"
        description="Các mốc dữ liệu được dùng khi thực hiện dự đoán."
      />
      <div className="card-body">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : (
          data && <PatientClinicalEditor patient={data} />
        )}
      </div>
    </Card>
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
              title="Thông tin cá nhân"
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
        {user.role === "patient" && user.patientId && (
          <OwnClinicalRecords patientId={user.patientId} />
        )}
      </div>
    </>
  );
}
