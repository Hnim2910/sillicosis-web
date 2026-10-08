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

## Tài khoản mock theo vai trò

Nhập email/số điện thoại và mật khẩu trên trang login. Vai trò được xác định từ tài khoản mock; không có nút vào demo hay tự điền mật khẩu. Mật khẩu chung: **Demo@123**.

| Vai trò       | Email                     |
| ------------- | ------------------------- |
| Bác sĩ        | doctor@silicosis.demo     |
| Bệnh nhân     | patient@silicosis.demo    |
| Kỹ thuật viên | technician@silicosis.demo |
| Quản trị viên | admin@silicosis.demo      |

Tài khoản bệnh nhân chỉ thấy hồ sơ và kết quả của mình. Đăng ký tạo tài khoản Patient mới và hồ sơ rỗng. Có thể dùng email hoặc số điện thoại để đăng ký/đăng nhập.

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
