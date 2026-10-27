import { expect, test, type Page } from "@playwright/test";

// End-to-end against a running backend (see docs/testing.md). Skipped when the API or the
// test accounts are not configured. Only the "creates a visit" test writes data, and only
// with E2E_WRITE=1; it deletes the visit and image it created afterwards (needs the admin account).

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");
const ADMIN = { id: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD };
const PATIENT = { id: process.env.E2E_PATIENT_EMAIL, password: process.env.E2E_PATIENT_PASSWORD };

async function apiReachable() {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, { method: "OPTIONS" });
    return response.status < 500;
  } catch {
    return false;
  }
}

test.beforeAll(async () => {
  test.skip(!(await apiReachable()), `Backend không chạy ở ${API_URL}`);
});

async function login(page: Page, account: { id?: string; password?: string }) {
  await page.goto("/login");
  await page.getByLabel("Email hoặc số điện thoại").fill(account.id!);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(account.password!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}

/** A synthetic grey-noise PNG made in the browser; it is not a real X-ray. */
async function syntheticPng(page: Page, size: number) {
  const dataUrl = await page.evaluate((side) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = side;
    const context = canvas.getContext("2d")!;
    const pixels = context.createImageData(side, side);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const value = Math.floor(Math.random() * 256);
      pixels.data.set([value, value, value, 255], i);
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL("image/png");
  }, size);
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

test.describe("admin", () => {
  test.skip(!ADMIN.id || !ADMIN.password, "Thiếu E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD");

  test("signs in and opens users, patients, records and dashboard", async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByText("Danh sách tài khoản")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Sửa tài khoản/ })).toHaveCount(0);
    await page.goto("/patients");
    await expect(page.getByText("Danh sách bệnh nhân")).toBeVisible();
    await page.goto("/admin/records");
    await expect(page.getByText("Các lượt khám")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page.getByText("Lượt khám gần đây")).toBeVisible();
    await expect(page.getByText("Chỉ sử dụng cho mục đích demo")).toHaveCount(0);
  });
});

test.describe("patient", () => {
  test.skip(!PATIENT.id || !PATIENT.password, "Thiếu E2E_PATIENT_EMAIL / E2E_PATIENT_PASSWORD");

  test("rejects a too-small image before uploading", async ({ page }) => {
    await login(page, PATIENT);
    await expect(page).toHaveURL(/\/dashboard$/);
    const uploads: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.startsWith("/api/images")) uploads.push(request.url());
    });
    await page.goto("/prediction");
    const small = await syntheticPng(page, 128);
    await page
      .getByLabel("Chọn ảnh X-quang")
      .setInputFiles({ name: "small.png", mimeType: "image/png", buffer: small });
    await expect(page.getByText("Ảnh quá nhỏ. Cạnh ngắn phải từ 256 pixel.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Lưu lượt khám & dự đoán" })).toBeDisabled();
    expect(uploads).toEqual([]);
  });

  test("creates a visit, shows the AI result and lists it in history", async ({ page }) => {
    test.skip(process.env.E2E_WRITE !== "1", "Chỉ chạy khi E2E_WRITE=1 (ghi dữ liệu thật)");
    await login(page, PATIENT);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/prediction");
    const image = await syntheticPng(page, 512);
    await page
      .getByLabel("Chọn ảnh X-quang")
      .setInputFiles({ name: "e2e-synthetic.png", mimeType: "image/png", buffer: image });
    await page.getByLabel("Chiều cao (cm)").fill("165");
    await page.getByRole("button", { name: "Lưu lượt khám & dự đoán" }).click();
    await expect(page).toHaveURL(/\/prediction\/[0-9a-f-]{36}$/, { timeout: 60_000 });
    const visitId = page.url().split("/").pop()!;
    // Either a result or a prediction failure with retry; both are valid backend outcomes.
    await expect(
      page.getByText(/Nghi bụi phổi silic|Không phát hiện|Thử lại/).first(),
    ).toBeVisible();
    await expect(page.getByText("165 cm")).toBeVisible();
    await page.goto("/history");
    await expect(page.locator(`a[href="/history/${visitId}"]`)).toBeVisible();

    if (ADMIN.id && ADMIN.password) {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: ADMIN.id, password: ADMIN.password }),
      });
      const { accessToken } = (await response.json()) as { accessToken: string };
      const headers = { Authorization: `Bearer ${accessToken}` };
      const visit = (await (
        await fetch(`${API_URL}/api/visits/${visitId}`, { headers })
      ).json()) as {
        image: { id: string } | null;
      };
      const removed = await fetch(`${API_URL}/api/visits/${visitId}`, {
        method: "DELETE",
        headers,
      });
      expect(removed.ok).toBe(true);
      if (visit.image) {
        const image = await fetch(`${API_URL}/api/images/${visit.image.id}`, {
          method: "DELETE",
          headers,
        });
        expect(image.ok).toBe(true);
      }
    }
  });
});
