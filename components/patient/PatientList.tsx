"use client";
import { useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import type { Patient } from "@/types/patient";
import { patientService } from "@/services/patientService";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Alert, EmptyState, ErrorState } from "@/components/common/Feedback";
import { Loading } from "@/components/common/Loading";
import { PatientForm } from "@/components/patient/PatientForm";
import { PatientTable } from "@/components/patient/PatientTable";
import { searchText } from "@/utils/format";

export function PatientList() {
  const { data, error, loading, reload } = useAsync(patientService.getPatients);
  const { user } = useAuth();
  const editable = user?.role === "admin";
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Patient | null | undefined>(undefined);
  const [success, setSuccess] = useState("");
  const patients =
    data?.filter((patient) =>
      searchText(`${patient.name} ${patient.id} ${patient.phone} ${patient.occupation}`).includes(
        searchText(query),
      ),
    ) || [];
  return (
    <>
      <PageHeader
        title="Hồ sơ bệnh nhân"
        description="Quản lý thông tin, tiền sử nghề nghiệp và dữ liệu theo dõi."
        action={
          editable && (
            <Button onClick={() => setEditing(null)}>
              <Plus size={17} />
              Thêm bệnh nhân
            </Button>
          )
        }
      />
      {success && (
        <div className="mb-5">
          <Alert tone="success">{success}</Alert>
        </div>
      )}
      <Card>
        <CardHeader
          title="Danh sách bệnh nhân"
          description={`${data?.length ?? 0} hồ sơ trong hệ thống`}
          action={<UsersRound size={19} className="text-teal-600" />}
        />
        <div className="toolbar">
          <Input
            label="Tìm kiếm bệnh nhân"
            placeholder="Họ tên, mã bệnh nhân, số điện thoại, nghề nghiệp…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : !patients.length ? (
          <EmptyState
            title={query ? "Không tìm thấy bệnh nhân" : "Chưa có hồ sơ bệnh nhân"}
            description={
              query
                ? "Thử tìm bằng tên hoặc mã bệnh nhân khác."
                : "Tạo hồ sơ đầu tiên để bắt đầu theo dõi."
            }
          />
        ) : (
          <PatientTable patients={patients} onEdit={editable ? setEditing : undefined} />
        )}
        <div className="table-footer">
          Hiển thị {patients.length} / {data?.length ?? 0} hồ sơ<span>Dữ liệu minh họa</span>
        </div>
      </Card>
      <Modal
        open={editing !== undefined}
        title={editing ? "Cập nhật hồ sơ" : "Thêm bệnh nhân"}
        onClose={() => setEditing(undefined)}
      >
        <PatientForm
          patient={editing || undefined}
          onCancel={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setSuccess("Đã lưu hồ sơ bệnh nhân.");
            void reload();
          }}
        />
      </Modal>
    </>
  );
}
