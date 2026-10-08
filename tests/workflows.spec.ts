import { expect, test, fillCredentials } from "./auth-fixture";
import type { Page } from "@playwright/test";
import path from "node:path";

async function login(page: Page, role = "Bác sĩ") {
  await page.goto("/login");
  await fillCredentials(page, role);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(role === "Quản trị viên" ? /\/admin\/users$/ : /\/dashboard$/);
}

test("login, dashboard and route states", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await fillCredentials(page, "Bác sĩ");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".alert-error")).toContainText("không chính xác");
  await login(page);
  await expect(page.getByRole("heading", { name: "Các lần phân tích gần đây" })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard-desktop.png", fullPage: true });
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeVisible();
  await page.goto("/history/not-found");
  await expect(page.getByText("Bản ghi không tồn tại hoặc đã bị xóa.")).toBeVisible();
});

test("patient create, edit, search and persist after reload", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Hồ sơ bệnh nhân", exact: true }).first().click();
  await page.getByRole("button", { name: "Thêm bệnh nhân" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Lưu hồ sơ" })).toBeDisabled();
  await dialog.getByLabel("Họ và tên").fill("Bệnh nhân kiểm thử");
  await dialog.getByLabel("Ngày sinh").fill("1985-04-12");
  await dialog.getByLabel("Nghề nghiệp").fill("Gia công đá");
  await dialog.getByLabel("Tiền sử tiếp xúc bụi").fill("Dữ liệu giả lập kiểm thử");
  await dialog.getByRole("button", { name: "Lưu hồ sơ" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByLabel("Tìm kiếm bệnh nhân").fill("kiem thu");
  await expect(page.getByRole("link", { name: "Bệnh nhân kiểm thử", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sửa hồ sơ Bệnh nhân kiểm thử" }).click();
  await dialog.getByLabel("Nghề nghiệp").fill("Sản xuất gốm");
  await dialog.getByRole("button", { name: "Lưu hồ sơ" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page.getByLabel("Tìm kiếm bệnh nhân").fill("Bệnh nhân kiểm thử");
  await expect(page.getByRole("cell", { name: "Sản xuất gốm", exact: true })).toBeVisible();
  await page.getByLabel("Tìm kiếm bệnh nhân").fill("nonexistent");
  await expect(page.getByRole("heading", { name: "Không tìm thấy bệnh nhân" })).toBeVisible();
});

test("prediction image validation, failure, result, review, PDF and history", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.goto("/prediction?patient=BN-0001");
  await page
    .getByLabel("Chọn ảnh X-quang", { exact: true })
    .setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("invalid") });
  await expect(page.locator(".alert-error")).toContainText("PNG hoặc JPEG");
  await page.getByRole("button", { name: "Dùng ảnh minh họa" }).click();
  const png = await page.getByRole("img", { name: "Ảnh đã chọn để dự đoán" }).screenshot();
  await page
    .getByLabel("Chọn ảnh X-quang", { exact: true })
    .setInputFiles({ name: "chest-test.png", mimeType: "image/png", buffer: png });
  await expect(page.getByText("chest-test.png", { exact: false })).toBeVisible();
  await page.getByLabel("Tôi đã kiểm tra và xác nhận dữ liệu theo dõi.").check();
  await page.getByLabel("Kịch bản demo").selectOption("model_error");
  await page.getByRole("button", { name: "Bắt đầu dự đoán" }).click();
  await expect(page.locator(".alert-error")).toContainText("mô hình tạm thời không khả dụng");
  await page.getByLabel("Kịch bản demo").selectOption("silicosis");
  await page.getByRole("button", { name: "Bắt đầu dự đoán" }).click();
  await expect(page).toHaveURL(/\/prediction\/PR-/);
  await expect(page.getByRole("heading", { name: "Kết quả phân tích", exact: true })).toBeVisible();
  await page.getByLabel("Xem giải thích XAI").check();
  await expect(page.getByText("Heatmap minh họa cố định", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Phóng to ảnh" }).click();
  await expect(page.getByText("125%", { exact: true })).toBeVisible();
  await page
    .getByLabel("Ghi chú / kết luận chuyên môn")
    .fill("Ghi chú kiểm thử, không phải kết luận y tế.");
  await page.getByLabel("Đánh giá kết quả AI").selectOption("further_testing");
  await page.getByRole("button", { name: "Lưu đánh giá" }).click();
  await expect(page.getByText("Đã lưu đánh giá chuyên môn.")).toBeVisible();
  await expect(
    page.getByText("Ghi chú kiểm thử, không phải kết luận y tế.", { exact: true }).first(),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất báo cáo PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^SilicoCare-PR-.*\.pdf$/);
  await download.saveAs("test-results/prediction-report.pdf");
  await page.screenshot({ path: "test-results/prediction-desktop.png", fullPage: true });
  await page.reload();
  await expect(
    page.getByText("Ghi chú kiểm thử, không phải kết luận y tế.", { exact: true }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("clinical CSV preview, validation and saved timeline", async ({ page }) => {
  await login(page);
  await page.goto("/patients/BN-0001");
  await page.getByLabel("Chọn tệp dữ liệu lâm sàng").setInputFiles({
    name: "bad.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("date,wrong\n2026-01-02,1"),
  });
  await expect(page.locator(".alert-error")).toContainText("Sai cấu trúc cột");
  await page.getByLabel("Chọn tệp dữ liệu lâm sàng").setInputFiles({
    name: "records.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "date,exposureYears,dustLevel,fvc,fev1\n2026-01-02,12,0.2,84,80\n2026-02-02,12,0.4,83,79",
    ),
  });
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("2 mốc hợp lệ", { exact: false })).toBeVisible();
  await dialog.getByRole("button", { name: "Xác nhận dữ liệu" }).click();
  await page.getByRole("button", { name: "Lưu dữ liệu theo dõi" }).click();
  await expect(page.getByText("Đã lưu dữ liệu theo dõi vào hồ sơ.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Mốc 1 · Ngày")).toHaveValue("2026-01-02");
  await page.getByLabel("Mốc 2 · Ngày").fill("2026-01-02");
  await expect(page.locator(".alert-error")).toContainText("mốc thời gian bị trùng");
  await expect(page.getByRole("button", { name: "Lưu dữ liệu theo dõi" })).toBeDisabled();
});

test("patient registration, empty history and ownership guard", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Họ và tên").fill("Người dùng mới");
  await page.getByLabel("Email", { exact: true }).fill("new@silicosis.demo");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("NewDemo@123");
  await page.getByLabel("Xác nhận mật khẩu").fill("NewDemo@123");
  await page.getByRole("button", { name: "Tạo tài khoản bệnh nhân" }).click();
  await page.getByRole("link", { name: "Đến trang đăng nhập" }).click();
  await page.getByLabel("Email hoặc số điện thoại").fill("new@silicosis.demo");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("NewDemo@123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Chưa có lần phân tích nào" })).toBeVisible();
  await page.goto("/history/PR-2026-0001");
  await expect(page.getByText("Bạn chỉ có thể xem hồ sơ và kết quả của mình.")).toBeVisible();
  await page.goto("/patients");
  await expect(page.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeVisible();
  await page.goto("/prediction");
  await expect(page.getByLabel("Chọn bệnh nhân")).toContainText("Người dùng mới");
  await expect(page.getByRole("button", { name: "Bắt đầu dự đoán" })).toBeDisabled();
});

test("admin account lock, self protection, cancel and record deletion", async ({ page }) => {
  await login(page, "Quản trị viên");
  await expect(
    page.getByRole("button", { name: "Khóa tài khoản Phạm Hoàng Nam", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Khóa tài khoản Trần Văn Hùng", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Trần Văn Hùng" })).toContainText("Đã khóa");
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await fillCredentials(page, "Bệnh nhân");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".alert-error")).toContainText("đã bị khóa");
  await login(page, "Quản trị viên");
  await page.goto("/admin/records");
  const row = page.getByRole("row").filter({ hasText: "PR-2026-0008" });
  await row.getByRole("button", { name: "Xóa bản ghi PR-2026-0008" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Xóa bản ghi PR-2026-0008" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xác nhận xóa", exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.goto("/history/PR-2026-0008");
  await expect(page.getByText("Bản ghi không tồn tại hoặc đã bị xóa.")).toBeVisible();
});

test("mobile sidebar, tablet layout and no page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.screenshot({ path: "test-results/login-mobile.png", fullPage: true });
  await login(page, "Kỹ thuật viên");
  await expect(page.getByRole("button", { name: "Mở menu" })).toBeVisible();
  await page.getByRole("button", { name: "Mở menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Dự đoán mới", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Dự đoán mới", exact: true })).toBeVisible();
  await expect(page.getByLabel("Chọn bệnh nhân")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bắt đầu dự đoán" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "test-results/prediction-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/dashboard");
  await expect(page.getByRole("table")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "test-results/dashboard-tablet.png", fullPage: true });
});

test("Excel import and patient Normal prediction", async ({ page }) => {
  await login(page, "Bệnh nhân");
  await page.goto("/prediction");
  await page
    .getByLabel("Chọn tệp dữ liệu lâm sàng")
    .setInputFiles(path.join(process.cwd(), "tests/fixtures/clinical-data.xlsx"));
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Xác nhận dữ liệu" }).click();
  await expect(page.getByLabel("Mốc 1 · Ngày")).toHaveValue("2026-02-14");
  await page.getByRole("button", { name: "Dùng ảnh minh họa" }).click();
  await page.getByLabel("Tôi đã kiểm tra và xác nhận dữ liệu theo dõi.").check();
  await page.getByLabel("Kịch bản demo").selectOption("normal");
  await page.getByRole("button", { name: "Bắt đầu dự đoán" }).click();
  await expect(page).toHaveURL(/\/prediction\/PR-/);
  await expect(page.locator(".result-label")).toHaveText("Normal");
  await expect(page.getByRole("button", { name: "Lưu đánh giá" })).toHaveCount(0);
  await page.goto("/history");
  await page.getByLabel("Kết quả", { exact: true }).selectOption("Normal");
  await expect(page.getByRole("table").getByText("Normal", { exact: true })).toHaveCount(1);
});

test("profile updates, password validation and phone-only registration", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Họ và tên").fill("Tài khoản số điện thoại");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("098 765 4321");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("PhoneDemo@123");
  await page.getByLabel("Xác nhận mật khẩu").fill("PhoneDemo@123");
  await page.getByRole("button", { name: "Tạo tài khoản bệnh nhân" }).click();
  await page.getByRole("link", { name: "Đến trang đăng nhập" }).click();
  await page.getByLabel("Email hoặc số điện thoại").fill("0987654321");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("PhoneDemo@123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/profile");
  await page.getByLabel("Họ và tên").fill("Hồ sơ đã cập nhật");
  await page.getByLabel("Nghề nghiệp", { exact: true }).fill("Gia công đá");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText("Đã cập nhật hồ sơ cá nhân.")).toBeVisible();
  await page.getByLabel("Mật khẩu hiện tại").fill("wrong-old-password");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("Changed@123");
  await page.getByLabel("Xác nhận mật khẩu mới").fill("Changed@123");
  await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
  await expect(page.locator(".alert-error")).toContainText("hiện tại không chính xác");
  await page.getByLabel("Mật khẩu hiện tại").fill("PhoneDemo@123");
  await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
  await expect(page.getByText("Đã đổi mật khẩu thành công.")).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.getByLabel("Email hoặc số điện thoại").fill("0987654321");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Changed@123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Chào Hồ sơ đã cập nhật", { exact: false })).toBeVisible();
});

test("admin creates account, prevents duplicate and edits record evaluation", async ({ page }) => {
  await login(page, "Quản trị viên");
  await page.getByRole("button", { name: "Thêm người dùng" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Họ và tên").fill("Bác sĩ thử nghiệm");
  await dialog.getByLabel("Email", { exact: true }).fill("doctor@silicosis.demo");
  await dialog.getByLabel("Vai trò", { exact: true }).selectOption("doctor");
  await dialog.getByLabel("Mật khẩu", { exact: true }).fill("Account@123");
  await dialog.getByRole("button", { name: "Lưu tài khoản" }).click();
  await expect(dialog.locator(".alert-error")).toContainText("đã tồn tại");
  await dialog.getByLabel("Email", { exact: true }).fill("doctor2@silicosis.demo");
  await dialog.getByRole("button", { name: "Lưu tài khoản" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("cell", { name: "doctor2@silicosis.demo", exact: false }),
  ).toBeVisible();
  await page.goto("/admin/records");
  await page.getByRole("button", { name: "Sửa bản ghi PR-2026-0008", exact: true }).click();
  await dialog.getByLabel("Nhãn phục vụ đánh giá mô hình").selectOption("incorrect");
  await dialog.getByLabel("Ghi chú quản trị").fill("Bản ghi cần rà soát trong demo.");
  await dialog.getByRole("button", { name: "Lưu cập nhật" }).click();
  await expect(dialog).not.toBeVisible();
  await page.goto("/history/PR-2026-0008");
  await expect(page.getByText("Bản ghi cần rà soát trong demo.")).toBeVisible();
  await expect(page.getByText("Đánh giá mô hình: Sai")).toBeVisible();
});
