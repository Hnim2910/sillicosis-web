"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { User } from "@/types/user";
import { userService } from "@/services/userService";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/constants/app";
import { errorMessage, searchText } from "@/utils/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Input, Select } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { UserTable } from "./UserTable";
import { Modal } from "@/components/common/Modal";
import { Loading } from "@/components/common/Loading";
import { Alert, EmptyState, ErrorState } from "@/components/common/Feedback";
import { AccountForm } from "./AccountForm";

export function UserManagement() {
  const { data, loading, error, reload } = useAsync(userService.list);
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<{
    user: User;
    action: "lock" | "unlock" | "delete";
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const users = (data || []).filter(
    (user) =>
      searchText(`${user.name} ${user.email} ${user.phone}`).includes(searchText(query)) &&
      (!role || user.role === role) &&
      (!status || String(user.active) === status),
  );
  const actionLabels = {
    lock: "Khóa tài khoản",
    unlock: "Mở khóa tài khoản",
    delete: "Xóa tài khoản",
  };
  return (
    <>
      <PageHeader
        title="Quản lý tài khoản"
        description="Tạo tài khoản bệnh nhân, khoá/mở khoá hoặc xoá tài khoản."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={17} />
            Thêm bệnh nhân
          </Button>
        }
      />
      {message && (
        <div className="mb-5">
          <Alert tone="success">{message}</Alert>
        </div>
      )}
      <Card>
        <CardHeader
          title="Danh sách tài khoản"
          description={`${data?.length || 0} người dùng trong hệ thống`}
        />
        <div className="toolbar">
          <Input
            label="Tìm kiếm tài khoản"
            placeholder="Họ tên, email hoặc số điện thoại…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select label="Vai trò" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">Tất cả vai trò</option>
            {Object.entries(ROLE_LABELS).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </Select>
          <Select
            label="Trạng thái"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </Select>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} retry={reload} />
        ) : !users.length ? (
          <EmptyState
            title="Không có tài khoản phù hợp"
            description="Thử thay đổi điều kiện tìm kiếm hoặc bộ lọc."
          />
        ) : (
          <UserTable
            users={users}
            currentUserId={currentUser?.id || ""}
            onAction={(user, action) => {
              setConfirm({ user, action });
              setActionError("");
            }}
          />
        )}
        <div className="table-footer">
          Hiển thị {users.length} tài khoản
          <span>Không thể tự khóa hoặc xóa tài khoản đang dùng</span>
        </div>
      </Card>
      <Modal open={creating} title="Thêm tài khoản bệnh nhân" onClose={() => setCreating(false)}>
        <AccountForm
          onCancel={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setMessage("Đã tạo tài khoản bệnh nhân.");
            void reload();
          }}
        />
      </Modal>
      <Modal
        open={!!confirm}
        title={confirm ? actionLabels[confirm.action] : "Xác nhận"}
        onClose={() => {
          if (!busy) setConfirm(null);
        }}
      >
        <div className="stack">
          {actionError && <Alert>{actionError}</Alert>}
          <p>
            {confirm?.action === "delete"
              ? "Xóa tài khoản"
              : confirm?.action === "lock"
                ? "Khóa quyền đăng nhập của"
                : "Khôi phục quyền đăng nhập cho"}{" "}
            <strong>{confirm?.user.name}</strong>?
          </p>
          {confirm?.action === "delete" && (
            <p className="notice">
              Tài khoản bị vô hiệu và không đăng nhập được nữa; hồ sơ bệnh nhân và các lượt khám vẫn
              được lưu để tra cứu.
            </p>
          )}
          <div className="form-actions">
            <Button variant="secondary" disabled={busy} onClick={() => setConfirm(null)}>
              Hủy
            </Button>
            <Button
              variant={confirm?.action === "unlock" ? "primary" : "danger"}
              busy={busy}
              onClick={async () => {
                if (!confirm) return;
                setBusy(true);
                setActionError("");
                try {
                  await userService.changeStatus(confirm.user.id, confirm.action);
                  setMessage(`${actionLabels[confirm.action]} thành công.`);
                  setConfirm(null);
                  void reload();
                } catch (reason) {
                  setActionError(errorMessage(reason));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
