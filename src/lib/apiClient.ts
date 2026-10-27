// HTTP client for the SilicoCare backend (contract: silicosis-backend/docs/api-auth.md).
// Never log tokens, passwords or OTPs from this module.

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");
const REFRESH_KEY = "silicocare-refresh-token";
const REFRESH_LOCK = "silicocare-refresh";
export const SESSION_EVENT = "silicosis-session";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: "Dữ liệu không hợp lệ.",
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy dữ liệu.",
  413: "Tệp quá lớn.",
  415: "Định dạng tệp không được hỗ trợ.",
  423: "Tài khoản đang tạm khoá. Vui lòng thử lại sau.",
};

// Access token lives only in memory; refresh token in localStorage so a reload can restore the session.
let accessToken: string | null = null;
let accessExpiresAt = 0;
let refreshing: Promise<boolean> | null = null;

function readRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function hasStoredSession() {
  return !!readRefreshToken();
}

/** True when another tab signed out (its refresh token was removed from shared storage). */
export function isSignOutEvent(event: StorageEvent) {
  return event.key === REFRESH_KEY && event.newValue === null;
}

export function storeTokens(tokens: TokenPair) {
  accessToken = tokens.accessToken;
  // Renew 30 s early so a request never leaves with an access token about to expire.
  accessExpiresAt = Date.now() + Math.max(tokens.expiresIn - 30, 0) * 1000;
  try {
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } catch {
    // Storage blocked: the session still works until the tab is reloaded.
  }
}

export function clearTokens() {
  accessToken = null;
  accessExpiresAt = 0;
  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // Nothing stored.
  }
}

/** Takes the refresh token out of storage, e.g. to revoke it on logout. */
export function takeRefreshToken() {
  const token = readRefreshToken();
  clearTokens();
  return token;
}

function accessTokenValid() {
  return !!accessToken && Date.now() < accessExpiresAt;
}

async function parseError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    code?: string;
    message?: string;
    fieldErrors?: Record<string, string>;
    details?: Record<string, unknown>;
  } | null;
  const fieldErrors = body?.fieldErrors || {};
  const details = Object.values(fieldErrors);
  const message =
    (details.length ? details.join(" ") : body?.message) ||
    FALLBACK_MESSAGES[response.status] ||
    "Máy chủ gặp sự cố. Vui lòng thử lại sau.";
  return new ApiError(
    response.status,
    body?.code || "UNKNOWN",
    message,
    fieldErrors,
    body?.details || {},
  );
}

async function send(path: string, init: RequestInit) {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Không kết nối được máy chủ SilicoCare. Vui lòng kiểm tra kết nối hoặc thử lại sau.",
    );
  }
}

let lastRefreshUser: unknown = null;

async function refreshOnce(): Promise<boolean> {
  const token = readRefreshToken();
  if (!token) return false;
  const response = await send("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: token }),
  });
  if (!response.ok) {
    const error = await parseError(response);
    // Only a rejected token ends the session; a 5xx keeps it so the user can retry.
    if (response.status === 401 || response.status === 403) {
      clearTokens();
      return false;
    }
    throw error;
  }
  const tokens = (await response.json()) as TokenPair & { user: unknown };
  storeTokens(tokens);
  lastRefreshUser = tokens.user;
  return true;
}

/** The user returned by the latest refresh, so session restore can skip a GET /me. */
export function consumeRefreshedUser() {
  const user = lastRefreshUser;
  lastRefreshUser = null;
  return user;
}

/**
 * Refreshes the access token. Concurrent callers in this tab share one promise; a Web Lock
 * serialises tabs, because refresh tokens rotate and reusing a rotated one revokes every session.
 */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    const locked = async (): Promise<boolean> =>
      typeof navigator !== "undefined" && navigator.locks
        ? await navigator.locks.request(REFRESH_LOCK, refreshOnce)
        : refreshOnce();
    refreshing = locked().finally(() => {
      refreshing = null;
    });
  }
  return refreshing!;
}

function sessionExpired() {
  clearTokens();
  window.dispatchEvent(new Event(SESSION_EVENT));
  if (!["/login", "/register", "/forgot-password"].includes(window.location.pathname))
    window.location.replace("/login");
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Sent as JSON, except FormData which goes out as multipart/form-data. */
  body?: unknown;
  /** Public endpoints (login, register, …) skip the Bearer token and the refresh flow. */
  auth?: boolean;
}

async function authorizedFetch(path: string, options: RequestOptions, accept: string) {
  const { method = "GET", body, auth = true } = options;
  const multipart = body instanceof FormData;
  const call = () => {
    const headers: Record<string, string> = { Accept: accept };
    // The browser sets the multipart boundary itself.
    if (body !== undefined && !multipart) headers["Content-Type"] = "application/json";
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return send(path, {
      method,
      headers,
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
    });
  };
  // At most one refresh per request: either up front (no valid access token) or after a 401.
  let refreshed = false;
  if (auth && !accessTokenValid()) {
    refreshed = true;
    if (!(await refreshSession())) {
      sessionExpired();
      throw new ApiError(401, "UNAUTHORIZED", FALLBACK_MESSAGES[401]);
    }
  }
  let response = await call();
  if (auth && response.status === 401) {
    if (refreshed || !(await refreshSession())) {
      sessionExpired();
      throw await parseError(response);
    }
    response = await call();
  }
  if (!response.ok) throw await parseError(response);
  return response;
}

export async function apiRequest<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await authorizedFetch(path, options, "application/json");
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Binary GET with the Bearer token, e.g. image content that an <img src> could not authorise. */
export async function apiBlob(path: string): Promise<Blob> {
  const response = await authorizedFetch(path, {}, "*/*");
  return response.blob();
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Loads every page of a paged list (size 100, the backend's maximum), newest first. Stops after 50 pages. */
export async function apiAllPages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  const join = path.includes("?") ? "&" : "?";
  for (let page = 0; page < 50; page++) {
    const result = await apiRequest<PageResponse<T>>(`${path}${join}page=${page}&size=100`);
    items.push(...result.content);
    if (page + 1 >= result.totalPages) break;
  }
  return items;
}
