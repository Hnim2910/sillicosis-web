# SilicoCare

Frontend hỗ trợ sàng lọc bệnh bụi phổi silic từ ảnh X-quang ngực, lưu từng lượt khám kèm chỉ số lâm sàng. Xây dựng theo `Nghiệp vụ.docx`, tham khảo cách tổ chức component/layout của project MediScan cùng workspace.

## Chạy dự án

```bash
npm ci
npm run dev
```

Mở http://localhost:3000. Trang gốc chuyển tới tổng quan; nếu chưa có phiên đăng nhập, hệ thống mở trang login.

```bash
npm run lint
npm run build
npm run test:e2e
```

Kiểm thử E2E chạy trên bản production build, tự mở server cổng 3040 và Chrome headless đã cài trên máy. Nếu máy không có Chrome, cài Chrome hoặc đổi `channel` trong `playwright.config.ts` sang trình duyệt Chromium/Edge phù hợp. Các ảnh kiểm thử, trace và PDF tải xuống nằm trong `test-results/` và được Git bỏ qua.

Phạm vi kiểm thử nghiệp vụ và các trường hợp hồi quy: [docs/testing.md](docs/testing.md).

## Kết nối backend

Toàn bộ dữ liệu (tài khoản, hồ sơ bệnh nhân, ảnh, lượt khám, kết quả chẩn đoán) đều đọc/ghi qua backend `silicosis-backend` (hợp đồng API trong `silicosis-backend/docs/`). Trình duyệt không lưu dữ liệu y tế; báo cáo PDF và số liệu tổng quan được tạo ở trình duyệt từ dữ liệu thật trả về.

1. Chạy backend theo hướng dẫn của repo backend (`docker compose up -d` rồi `./mvnw clean spring-boot:run`) và dịch vụ chẩn đoán FastAPI mà backend gọi tới. Thiếu dịch vụ chẩn đoán thì lượt khám vẫn lưu được nhưng kết quả báo lỗi và có nút thử lại.
2. Tạo `.env.local` từ `.env.example`, đặt `NEXT_PUBLIC_API_URL` trỏ tới backend (mặc định `http://localhost:8080`). Biến này được gắn vào bundle lúc build: đổi giá trị thì khởi động lại `npm run dev` hoặc build lại.
3. Nếu web chạy ở origin khác `http://localhost:3000`, thêm origin đó vào biến môi trường `APP_CORS_ALLOWED_ORIGIN_PATTERNS` của backend (thuộc tính `app.cors.allowed-origin-patterns`, các giá trị cách nhau bởi dấu phẩy).

| Vai trò       | Tài khoản                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Quản trị viên | Tài khoản duy nhất được seed từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env` của backend                                      |
| Bệnh nhân     | Tự đăng ký tại `/register` (email bắt buộc, SĐT không bắt buộc), hoặc admin tạo ở `/admin/users`; hồ sơ bệnh nhân được tạo kèm |

Mật khẩu: 8–72 ký tự, có ít nhất 1 chữ cái và 1 chữ số. Sai mật khẩu 5 lần liên tiếp thì tài khoản bị khoá 15 phút. Quên mật khẩu: nhập email → mã OTP 6 chữ số gửi qua email → đặt mật khẩu mới.

Phiên đăng nhập: access token chỉ giữ trong bộ nhớ của tab; refresh token lưu trong `localStorage` (khoá `silicocare-refresh-token`) để giữ phiên khi tải lại trang.

## Source code

```text
components/                 UI tách riêng, nằm ngoài src
  common/                   Button, Input, Modal, Table, Loading, Feedback...
  layout/                   Header, Sidebar, MainLayout
  auth/                     Login, register và layout xác thực
  dashboard/                Tổng quan, thống kê, truy cập nhanh
  patient/                  Danh sách, form và chi tiết hồ sơ bệnh nhân
  prediction/               Form lượt khám, upload ảnh, kết quả và lịch sử
  admin/                    Quản lý tài khoản
  profile/                  Hồ sơ cá nhân và đổi mật khẩu
src/
  app/                      Page, route và layout
    (workspace)/            Route group dùng chung MainLayout
    login/
    register/
  constants/                Menu, nhãn và thông báo
  contexts/                 Trạng thái phiên đăng nhập
  hooks/                    Tải dữ liệu (loading/error/retry), URL ảnh có xác thực
  lib/                      apiClient: token, refresh, lỗi, phân trang
  services/                 Gọi API và chuyển đổi dữ liệu backend ↔ web
  styles/                   CSS dùng chung, layout, auth, workspace, responsive
  types/                    TypeScript domain types
  utils/                    Format, validation, form lượt khám
```

`@/components/*` trỏ đến thư mục `components/` ở gốc; `@/*` còn lại trỏ đến `src/`. Các thư mục dự phòng `i18n`, `mocks` chưa chứa logic. Component không gọi `fetch` trực tiếp, chỉ đi qua `src/services`.

Phân tích MediScan, danh sách màn hình, actor, quyết định kiến trúc và các giả định cần xác nhận: [docs/architecture.md](docs/architecture.md).

## Luồng sử dụng

1. Bệnh nhân đăng nhập → **Chẩn đoán** → chọn ảnh X-quang ngực (PNG/JPEG ≤ 10 MB, cạnh ngắn ≥ 256 px), nhập ngày khám và các chỉ số (không bắt buộc) → **Lưu lượt khám & chẩn đoán**.
2. Trang kết quả hiển thị nhãn, xác suất so với ngưỡng, mô hình/phiên bản, ảnh (phóng to được) và các chỉ số đã nhập. Chẩn đoán lỗi thì có nút **Thử lại**. Kết quả thành công xuất được báo cáo PDF.
3. **Lịch sử** liệt kê các lượt khám, lọc theo kết quả và ngày khám. **Hồ sơ cá nhân** cho cập nhật thông tin tài khoản và hồ sơ bệnh nhân.
4. Admin: tạo/khoá/mở khoá/xoá tài khoản bệnh nhân, xem và sửa hồ sơ bệnh nhân, tra cứu và xoá lượt khám của mọi bệnh nhân.

## Giới hạn

Mô hình hiện tại (BioViL-T fine-tune, Set A) chỉ đọc ảnh; các chỉ số lâm sàng được lưu để theo dõi, không đưa vào mô hình. Kết quả mang tính thử nghiệm nghiên cứu, không thay thế chẩn đoán của bác sĩ.

Chưa có: đánh giá chuyên môn của bác sĩ, ghi chú/đánh giá của admin trên bản ghi, bản đồ nhiệt giải thích (XAI), sửa tài khoản hoặc đổi vai trò. Các phần này đã được ẩn khỏi giao diện cho đến khi backend hỗ trợ. Gói `read-excel-file` trong `package.json` không còn được dùng (tính năng nhập Excel đã bỏ), có thể gỡ bằng `npm uninstall read-excel-file`.
