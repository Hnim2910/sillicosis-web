import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { validPastDate, validatePatient } from "@/utils/validation";
import { wrapText } from "@/utils/wrapText";
import { clinicalRowsToRecords } from "@/services/clinicalService";

async function login(page: Page, role: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: role, exact: true }).click();
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(role === "Quản trị viên" ? /\/admin\/users$/ : /\/dashboard$/);
}

test("calendar validation rejects impossible dates and accepts leap days", () => {
  for (const value of [
    "2025-02-29",
    "2024-02-30",
    "2026-04-31",
    "1900-02-29",
    "2026-13-01",
    "9999-01-01",
    "2026-1-01",
  ]) {
    expect(validPastDate(value), value).toBe(false);
  }
  expect(validPastDate("2000-02-29")).toBe(true);
  expect(validPastDate("2024-02-29")).toBe(true);
  expect(
    validatePatient({
      name: "Bệnh nhân test",
      birthDate: "2025-02-29",
      gender: "other",
      phone: "",
      occupation: "Gia công đá",
      workplace: "",
      exposureHistory: "",
      riskFactors: "",
    }),
  ).toBe("Ngày sinh không hợp lệ.");
});

test("Excel boolean cells are not silently converted into clinical numbers", () => {
  const headers = ["date", "exposureYears", "dustLevel", "fvc", "fev1"];
  expect(() => clinicalRowsToRecords([headers, ["2026-01-01", 5, true, 80, 75]])).toThrow(
    "các chỉ số phải là số",
  );
  expect(() => clinicalRowsToRecords([headers, ["2026-01-01", 5, "", 80, 75]])).toThrow(
    "không được để trống",
  );
});

test("report wrapping preserves long notes and paragraph breaks", () => {
  const longWord = "ghi-chú-".repeat(80);
  const lines = wrapText(`Ghi chú bác sĩ\n\n${longWord}`, (text) => text.length * 9, 450);
  expect(lines[0]).toBe("Ghi chú bác sĩ");
  expect(lines[1]).toBe("");
  expect(lines.slice(2).join("")).toBe(longWord);
  expect(lines.every((line) => line.length <= 50)).toBe(true);
});

test.describe("calendar dates in a timezone behind UTC", () => {
  test.use({ timezoneId: "America/Los_Angeles" });
  test("birthdays retain their calendar day and Đ names match unaccented search", async ({
    page,
  }) => {
    await login(page, "Bác sĩ");
    await page.goto("/patients");
    await expect(page.getByRole("row").filter({ hasText: "Trần Văn Hùng" })).toContainText(
      "12/05/1978",
    );
    await page.getByLabel("Tìm kiếm bệnh nhân").fill("dang minh duc");
    await expect(page.getByRole("link", { name: "Đặng Minh Đức", exact: true })).toBeVisible();
    await page.getByLabel("Tìm kiếm bệnh nhân").fill("ĐẶNG MINH ĐỨC");
    await expect(page.getByRole("link", { name: "Đặng Minh Đức", exact: true })).toBeVisible();
  });
});

test("admin unlock, role change and account deletion persist", async ({ page }) => {
  await login(page, "Quản trị viên");
  const dialog = page.getByRole("dialog");
  await page.getByRole("button", { name: "Khóa tài khoản Lê Thu Hà", exact: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Mở khóa tài khoản Lê Thu Hà", exact: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Sửa tài khoản Lê Thu Hà", exact: true }).click();
  await dialog.getByLabel("Vai trò", { exact: true }).selectOption("doctor");
  await dialog.getByRole("button", { name: "Lưu tài khoản", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.getByRole("button", { name: "Kỹ thuật viên", exact: true }).click();
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/history/PR-2026-0001");
  await expect(page.getByRole("button", { name: "Lưu đánh giá", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page, "Quản trị viên");
  await page.getByRole("button", { name: "Xóa tài khoản Lê Thu Hà", exact: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Lê Thu Hà" })).toHaveCount(0);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.getByRole("button", { name: "Kỹ thuật viên", exact: true }).click();
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".alert-error")).toContainText("không chính xác");
});

test("rejected image does not create a prediction history record", async ({ page }) => {
  await login(page, "Bệnh nhân");
  await page.goto("/prediction");
  await page.getByRole("button", { name: "Dùng ảnh minh họa" }).click();
  await page.getByLabel("Tôi đã kiểm tra và xác nhận dữ liệu theo dõi.").check();
  await page.getByLabel("Kịch bản demo").selectOption("invalid_image");
  await page.getByRole("button", { name: "Bắt đầu dự đoán" }).click();
  await expect(page.locator(".alert-error")).toContainText("ảnh không phải X-quang ngực phù hợp");
  await page.goto("/history");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(3);
});

test("long multiline notes produce a complete multi-page PDF", async ({ page }) => {
  await login(page, "Bác sĩ");
  await page.goto("/history/PR-2026-0001");
  await page
    .getByLabel("Ghi chú / kết luận chuyên môn")
    .fill(
      "Ghi chú kiểm thử dài.\n\n" +
        "Nội dung theo dõi và đánh giá trong bản demo. ".repeat(65) +
        "\n" +
        "chuỗi-dài-".repeat(75),
    );
  await page.getByRole("button", { name: "Lưu đánh giá", exact: true }).click();
  await expect(page.getByText("Đã lưu đánh giá chuyên môn.")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất báo cáo PDF", exact: true }).click();
  const download = await downloadPromise;
  const filename = test.info().outputPath("long-report.pdf");
  await download.saveAs(filename);
  const bytes = await readFile(filename);
  const content = bytes.toString("latin1");
  expect(content.startsWith("%PDF-")).toBe(true);
  expect(content.trimEnd().endsWith("%%EOF")).toBe(true);
  expect((content.match(/\/Type \/Page\b/g) || []).length).toBeGreaterThan(1);
});
