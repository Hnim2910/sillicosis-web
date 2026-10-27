import type { AccountInput } from "@/types/user";
import { apiAllPages, apiRequest } from "@/lib/apiClient";
import { toUser } from "@/services/userMapper";
import type { ApiUser } from "@/services/userMapper";
import { PASSWORD_RULE, validEmail, validPassword, validVnMobile } from "@/utils/validation";

/** Mirrors CreateUserRequest; the backend has the final say. */
export function validateAccount(input: AccountInput) {
  if (input.name.trim().length < 2 || input.name.trim().length > 150)
    return "Họ tên dài 2–150 ký tự.";
  if (!validEmail(input.email.trim())) return "Email không hợp lệ.";
  if (!validVnMobile(input.phone)) return "Số điện thoại di động Việt Nam không hợp lệ.";
  if (!validPassword(input.password)) return `Mật khẩu: ${PASSWORD_RULE}`;
  return "";
}

// Admin-only endpoints of /api/users. Accounts created here always get the USER role
// and a linked patient record; editing another account or changing roles is not supported.
export const userService = {
  async list() {
    return (await apiAllPages<ApiUser>("/api/users")).map(toUser);
  },
  async create(input: AccountInput) {
    const problem = validateAccount(input);
    if (problem) throw new Error(problem);
    const user = await apiRequest<ApiUser>("/api/users", {
      method: "POST",
      body: {
        fullName: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim() || null,
        password: input.password,
      },
    });
    return toUser(user);
  },
  async changeStatus(id: string, action: "lock" | "unlock" | "delete") {
    if (action === "delete") {
      await apiRequest<void>(`/api/users/${id}`, { method: "DELETE" });
      return;
    }
    await apiRequest<ApiUser>(`/api/users/${id}/status`, {
      method: "PATCH",
      body: { enabled: action === "unlock" },
    });
  },
};
