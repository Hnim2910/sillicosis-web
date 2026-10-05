import Link from "next/link";
import { ArrowUpRight, Pencil } from "lucide-react";
import type { Patient } from "@/types/patient";
import { Table } from "@/components/common/Table";
import { Button } from "@/components/common/Button";
import { GENDER_LABELS } from "@/constants/app";
import { formatDate, initials } from "@/utils/format";

export function PatientTable({
  patients,
  onEdit,
}: {
  patients: Patient[];
  onEdit?: (patient: Patient) => void;
}) {
  return (
    <Table
      caption="Danh sách hồ sơ bệnh nhân"
      headers={["Bệnh nhân", "Ngày sinh", "Giới tính", "Nghề nghiệp", "Mốc theo dõi", "Thao tác"]}
    >
      {patients.map((patient) => (
        <tr key={patient.id}>
          <td>
            <div className="cell-person">
              <span className="avatar">{initials(patient.name)}</span>
              <div>
                <Link href={`/patients/${patient.id}`}>
                  <strong>{patient.name}</strong>
                </Link>
                <small>{patient.id}</small>
              </div>
            </div>
          </td>
          <td>{formatDate(patient.birthDate)}</td>
          <td>{GENDER_LABELS[patient.gender]}</td>
          <td>{patient.occupation || "Chưa cập nhật"}</td>
          <td>{patient.clinicalRecords.length} mốc</td>
          <td>
            <div className="flex items-center gap-2">
              <Link
                href={`/patients/${patient.id}`}
                className="btn btn-ghost"
                aria-label={`Xem hồ sơ ${patient.name}`}
              >
                <ArrowUpRight size={16} />
              </Link>
              {onEdit && (
                <Button
                  variant="ghost"
                  aria-label={`Sửa hồ sơ ${patient.name}`}
                  onClick={() => onEdit(patient)}
                >
                  <Pencil size={15} />
                </Button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </Table>
  );
}
