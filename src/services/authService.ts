import type { AccountInput, ProfileInput, User } from "@/types/user";
import {
  apiRequest,
  clearTokens,
  consumeRefreshedUser,
  hasStoredSession,
  refreshSession,
  SESSION_EVENT,
  storeTokens,
  takeRefreshToken,
} from "@/lib/apiClient";
import type { TokenPair } from "@/lib/apiClient";
import { toApiProfile, toUser } from "@/services/userMapper";
import type { ApiUser } from "@/services/userMapper";

type AuthResponse = TokenPair & { user: ApiUser };

// Signed-in user for this tab.
let sessionUser: User | null = null;

function setSessionUser(user: User | null) {
  sessionUser = user;
  window.dispatchEvent(new Event(SESSION_EVENT));
  return user;
}

function startSession(response: AuthResponse) {
  storeTokens(response);
  return setSessionUser(toUser(response.user))!;
}

export const authService = {
  /** Returns the signed-in user, restoring the session from the stored refresh token after a reload. */
  async getCurrentUser() {
    if (!hasStoredSession()) {
      // Another tab may have signed out: drop this tab's access token too.
      clearTokens();
      sessionUser = null;
      return null;
    }
    if (sessionUser) return sessionUser;
    if (!(await refreshSession())) return null;
    const user = consumeRefreshedUser() as ApiUser | null;
    sessionUser = toUser(user || (await apiRequest<ApiUser>("/api/users/me")));
    return sessionUser;
  },
  async login(identifier: string, password: string) {
    const response = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { identifier: identifier.trim(), password },
      auth: false,
    });
    return startSession(response);
  },
  async logout() {
    const refreshToken = takeRefreshToken();
    setSessionUser(null);
    if (!refreshToken) return;
    // Revoking server-side is best effort: the local session is already gone.
    await apiRequest("/api/auth/logout", {
      method: "POST",
      body: { refreshToken },
      auth: false,
    }).catch(() => undefined);
  },
  /** Backend signs the new patient in straight away. */
  async register(input: AccountInput) {
    const response = await apiRequest<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: {
        fullName: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim() || null,
        password: input.password,
      },
      auth: false,
    });
    return startSession(response);
  },
  async updateProfile(input: ProfileInput) {
    const user = await apiRequest<ApiUser>("/api/users/me", {
      method: "PUT",
      body: toApiProfile(input),
    });
    return setSessionUser(toUser(user))!;
  },
  async changePassword(oldPassword: string, newPassword: string) {
    await apiRequest("/api/users/me/password", {
      method: "PUT",
      body: { currentPassword: oldPassword, newPassword },
    });
    // The backend revokes every refresh token on success; sign in again to keep this tab's session.
    const email = sessionUser?.email;
    try {
      if (!email) throw new Error();
      await authService.login(email, newPassword);
    } catch {
      clearTokens();
      setSessionUser(null);
    }
  },
  /** Always resolves with the same message, whether or not the email is registered. */
  async forgotPassword(email: string) {
    const response = await apiRequest<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: { email: email.trim() },
      auth: false,
    });
    return response.message;
  },
  async verifyOtp(email: string, otp: string) {
    const response = await apiRequest<{ resetToken: string }>("/api/auth/verify-otp", {
      method: "POST",
      body: { email: email.trim(), otp },
      auth: false,
    });
    return response.resetToken;
  },
  async resetPassword(resetToken: string, newPassword: string) {
    await apiRequest("/api/auth/reset-password", {
      method: "POST",
      body: { resetToken, newPassword },
      auth: false,
    });
  },
};
