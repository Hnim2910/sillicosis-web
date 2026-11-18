"use client";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/constants/app";
import { PASSWORD_RULE } from "@/utils/validation";
import { Card, CardHeader } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { Loading } from "@/components/common/Loading";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

export function ProfileOverview() {
  const { user } = useAuth();
  if (!user) return <Loading />;
  return (
    <>
      <PageHeader
        title="Hồ sơ cá nhân"
        description={user.code ? `${ROLE_LABELS[user.role]} · Mã ${user.code}` : ROLE_LABELS[user.role]}
      />
      <div className="prediction-grid">
        <Card>
          <CardHeader
            title="Thông tin cá nhân"
            description={
              user.role === "patient"
                ? "Giới tính, năm sinh và nghề nghiệp được dùng sẵn khi dự đoán."
                : undefined
            }
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
    </>
  );
}
