import { test, expect, fillCredentials } from "./auth-fixture";

test("two roles sign in with mock data without calling an API or showing demo controls", async ({
  page,
}) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url());
  });
  for (const role of ["Bệnh nhân", "Quản trị viên"]) {
    await page.goto("/login");
    await expect(page.getByText("Khám phá bản demo")).toHaveCount(0);
    await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveValue("");
    await fillCredentials(page, role);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(role === "Quản trị viên" ? /\/admin\/users$/ : /\/dashboard$/);
    await page.reload();
    await expect(page.getByRole("button", { name: "Đăng xuất", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  }
  expect(apiRequests).toEqual([]);
});
