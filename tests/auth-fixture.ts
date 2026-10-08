import { expect, test, type Page } from "@playwright/test";
export { expect, test };
export async function fillCredentials(page: Page, role: string) {
  const emails: Record<string, string> = {
    "Bệnh nhân": "patient",
    "Quản trị viên": "admin",
  };
  await page.getByLabel("Email hoặc số điện thoại").fill(emails[role] + "@silicosis.demo");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Demo@123");
}
