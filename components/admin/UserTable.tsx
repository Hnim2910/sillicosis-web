import { LockKeyhole, LockKeyholeOpen, Trash2 } from "lucide-react";
import type { User } from "@/types/user";
import { ROLE_LABELS } from "@/constants/app";
import { initials } from "@/utils/format";
import { Table } from "@/components/common/Table";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";

export function UserTable({
  users,
  currentUserId,
  onAction,
}: {
  users: User[];
  currentUserId: string;
  onAction: (user: User, action: "lock" | "unlock" | "delete") => void;
}) {
  return (
    <Table
      caption="Danh sách tài khoản người dùng"
      headers={["Người dùng", "Số điện thoại", "Vai trò", "Trạng thái", "Thao tác"]}
    >
      {users.map((user) => (
        <tr key={user.id}>
          <td>
            <div className="cell-person">
              <span className="avatar">{initials(user.name)}</span>
              <div>
                <strong>
                  {user.name}
                  {user.id === currentUserId && " (Bạn)"}
                </strong>
                <small>{user.email}</small>
              </div>
            </div>
          </td>
          <td>{user.phone || "Chưa có số điện thoại"}</td>
          <td>{ROLE_LABELS[user.role]}</td>
          <td>
            <Badge tone={user.active ? "success" : "danger"}>
              {user.active ? "Hoạt động" : "Đã khóa"}
            </Badge>
          </td>
          <td>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                aria-label={`${user.active ? "Khóa" : "Mở khóa"} tài khoản ${user.name}`}
                disabled={user.id === currentUserId}
                onClick={() => onAction(user, user.active ? "lock" : "unlock")}
              >
                {user.active ? <LockKeyhole size={15} /> : <LockKeyholeOpen size={15} />}
              </Button>
              <Button
                variant="ghost"
                aria-label={`Xóa tài khoản ${user.name}`}
                disabled={user.id === currentUserId}
                onClick={() => onAction(user, "delete")}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </Table>
  );
}
