import type { Patient } from "@/types/patient";
import { Card } from "@/components/common/Card";
import { formatDate, initials } from "@/utils/format";
import { GENDER_LABELS } from "@/constants/app";

export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <Card>
      <div className="patient-identity">
        <span className="avatar">{initials(patient.name)}</span>
        <h2>{patient.name}</h2>
        <p>{patient.code}</p>
      </div>
      <div className="card-body">
        <dl className="info-list">
          <div>
            <dt>Ngày sinh</dt>
            <dd>{formatDate(patient.birthDate)}</dd>
          </div>
          <div>
            <dt>Giới tính</dt>
            <dd>{patient.gender ? GENDER_LABELS[patient.gender] : "Chưa cập nhật"}</dd>
          </div>
          <div className="full">
            <dt>Số điện thoại</dt>
            <dd>{patient.phone || "Chưa cập nhật"}</dd>
          </div>
          <div className="full">
            <dt>Nghề nghiệp</dt>
            <dd>{patient.occupation || "Chưa cập nhật"}</dd>
          </div>
          <div className="full">
            <dt>Nơi làm việc</dt>
            <dd>{patient.workplace || "Chưa cập nhật"}</dd>
          </div>
          <div className="full">
            <dt>Tiền sử tiếp xúc bụi</dt>
            <dd>{patient.exposureHistory || "Chưa cập nhật"}</dd>
          </div>
          <div className="full">
            <dt>Yếu tố nguy cơ</dt>
            <dd>{patient.riskFactors || "Chưa cập nhật"}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
