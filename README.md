# SilicoCare

Frontend prototype hỗ trợ sàng lọc bệnh bụi phổi silic từ ảnh X-quang và dữ liệu theo thời gian. Xây dựng theo `Nghiệp vụ.docx`, tham khảo cách tổ chức component/layout của project MediScan cùng workspace.

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

## Đăng nhập (backend thật)

Đăng ký, đăng nhập, quên mật khẩu, hồ sơ cá nhân và đổi mật khẩu gọi backend `silicosis-backend` (hợp đồng API: `silicosis-backend/docs/api-auth.md`). Các phần còn lại (bệnh nhân, ảnh, dự đoán, báo cáo, tổng quan, trang quản trị người dùng) vẫn là mock trong trình duyệt.

1. Chạy backend theo hướng dẫn của repo backend (`docker compose up -d` rồi `./mvnw clean spring-boot:run`).
2. Tạo `.env.local` từ `.env.example`, đặt `NEXT_PUBLIC_API_URL` trỏ tới backend (mặc định `http://localhost:8080`). Biến này được gắn vào bundle lúc build: đổi giá trị thì khởi động lại `npm run dev` hoặc build lại.
3. Nếu web chạy ở origin khác `http://localhost:3000`, thêm origin đó vào biến môi trường `APP_CORS_ALLOWED_ORIGIN_PATTERNS` của backend (thuộc tính `app.cors.allowed-origin-patterns`, các giá trị cách nhau bởi dấu phẩy).

| Vai trò       | Tài khoản                                                            |
| ------------- | -------------------------------------------------------------------- |
| Quản trị viên | Tài khoản duy nhất được seed từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env` của backend |
| Bệnh nhân     | Tự đăng ký tại `/register` (email bắt buộc, SĐT không bắt buộc), đăng ký xong tự đăng nhập |

Mật khẩu: 8–72 ký tự, có ít nhất 1 chữ cái và 1 chữ số. Sai mật khẩu 5 lần liên tiếp thì tài khoản bị khoá 15 phút. Quên mật khẩu: nhập email → mã OTP 6 chữ số gửi qua email → đặt mật khẩu mới.

Phiên đăng nhập: access token chỉ giữ trong bộ nhớ của tab; refresh token lưu trong `localStorage` (khoá `silicocare-refresh-token`) để giữ phiên khi tải lại trang. Tài khoản bệnh nhân từ backend chưa liên kết với hồ sơ bệnh nhân mock nên các trang hồ sơ/kết quả của bệnh nhân đang trống. Tài khoản mock cũ (`*@silicosis.demo`, `Demo@123`) không còn đăng nhập được; chúng chỉ còn là dữ liệu hiển thị trong trang quản trị mock.

## Source code

```text
components/                 UI tách riêng, nằm ngoài src
  common/                   Button, Input, Modal, Table, Loading, Feedback...
  layout/                   Header, Sidebar, MainLayout
  auth/                     Login, register và layout xác thực
  dashboard/                Tổng quan, thống kê, truy cập nhanh
  patient/                  Hồ sơ, form, bảng và dữ liệu theo thời gian
  prediction/               Upload, dự đoán, kết quả, XAI và lịch sử
  admin/                    Tài khoản và quản lý bản ghi
  profile/                  Hồ sơ cá nhân và đổi mật khẩu
src/
  app/                      Page, route và layout
    (workspace)/            Route group dùng chung MainLayout
    login/
    register/
  constants/                Menu, nhãn và cấu hình demo
  contexts/                 Trạng thái phiên đăng nhập
  data/                     Mock data tập trung
  hooks/                    Tải dữ liệu, loading/error/retry
  services/                 Ranh giới cho việc thay mock bằng backend
  styles/                   CSS dùng chung, layout, auth, workspace, responsive
  types/                    TypeScript domain types
  utils/                    Format và validation
public/
  images/                   Ảnh minh họa demo
  templates/                Mẫu dữ liệu CSV
```

`@/components/*` trỏ đến thư mục `components/` ở gốc; `@/*` còn lại trỏ đến `src/`. Các thư mục dự phòng từ cấu trúc ban đầu như `i18n`, `lib`, `mocks` chưa chứa logic nghiệp vụ. Không import mock data trực tiếp từ component hay page.

Phân tích MediScan, danh sách màn hình, actor, quyết định kiến trúc và các giả định cần xác nhận: [docs/architecture.md](docs/architecture.md).

## Luồng demo

1. Đăng nhập bằng Bác sĩ hoặc Kỹ thuật viên; xem/tạo/sửa hồ sơ bệnh nhân.
2. Mở hồ sơ để nhập dữ liệu theo thời gian, hoặc nhập tệp `.xlsx`/`.csv` theo mẫu và xác nhận bảng preview.
3. Chọn **Dự đoán mới**, chọn bệnh nhân, upload PNG/JPEG hoặc dùng ảnh minh họa.
4. Xác nhận các mốc theo dõi và chọn kịch bản Normal/Silicosis hoặc kịch bản lỗi.
5. Xem kết quả, bật/tắt heatmap minh họa, phóng to ảnh. Kết quả thành công tự lưu vào lịch sử.
6. Bác sĩ có thể đánh giá đồng ý/không đồng ý/kiểm tra thêm và ghi chú. Dùng nút xuất PDF để tải báo cáo.
7. Admin có thể tạo/sửa/khóa/mở khóa/xóa người dùng và sửa ghi chú, đánh giá đúng/sai, xóa bản ghi sau xác nhận.

## Dữ liệu và giới hạn

Dữ liệu demo lưu ở localStorage dưới khóa `silicosis-demo-v1`, phiên đăng nhập ở sessionStorage. Muốn trở lại dữ liệu mẫu ban đầu, xóa dữ liệu trang web trong trình duyệt rồi tải lại. Dữ liệu không được gửi lên server hay chia sẻ giữa các thiết bị.

Không có backend, JWT, inference thật hoặc kiểm tra ảnh X-quang bằng AI. Nhãn, xác suất và heatmap đều là mô phỏng; ảnh tải lên chỉ kiểm tra định dạng/khả năng đọc/kích thước và được nén thành preview để lưu. Không sử dụng bản demo với dữ liệu bệnh nhân thật hoặc để đưa ra chẩn đoán.

Bốn vai trò là cách hợp nhất tạm thời hai phần chưa thống nhất của tài liệu. Schema lâm sàng, ngưỡng nhập liệu và quyền thực hiện dự đoán của Kỹ thuật viên là quy ước demo đã ghi rõ trong tài liệu kiến trúc. Các phần này cần được chốt trước khi kết nối backend.
