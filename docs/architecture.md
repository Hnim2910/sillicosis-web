# Kiến trúc frontend SilicoCare

## Nguồn nghiệp vụ

Đã đọc toàn bộ nội dung `Nghiệp vụ.docx`, gồm phần 4.1.1, 4.1.2 và 12 use case. Đây là prototype Next.js, không có API backend, cơ sở dữ liệu server, JWT hoặc mô hình AI thật.

Tài liệu chưa thống nhất về actor: phần yêu cầu đề cập Bác sĩ, Kỹ thuật viên, Admin; use case chi tiết đề cập Patient, Admin và Guest đăng ký. Prototype tạm hỗ trợ hợp nhất bốn vai trò. Quyết định này cần được chủ nghiệp vụ xác nhận; cấu hình quyền được tách riêng để có thể điều chỉnh.

| Vai trò       | Phạm vi                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Guest         | Đăng ký tài khoản Patient, đăng nhập                                                                               |
| Patient       | Hồ sơ cá nhân, đổi mật khẩu, dữ liệu theo thời gian, dự đoán và lịch sử của mình, XAI minh họa, xuất PDF           |
| Bác sĩ        | Xem/tạo/sửa hồ sơ bệnh nhân, nhập dữ liệu, dự đoán, xem lịch sử, đánh giá chuyên môn                               |
| Kỹ thuật viên | Tạo/sửa hồ sơ, nhập dữ liệu, upload và thực hiện luồng dự đoán demo, xem lịch sử; không đánh giá chuyên môn        |
| Admin         | Quản lý người dùng, khóa/mở khóa/xóa tài khoản, phân quyền, tra cứu và quản lý bản ghi; không tự khóa/xóa/hạ quyền |

Quyền Kỹ thuật viên thực hiện toàn bộ luồng dự đoán là quy ước demo từ phần yêu cầu hỗ trợ sàng lọc; tài liệu chưa đặc tả riêng use case cho vai trò này. Admin chỉ đọc hồ sơ y tế, không sửa dữ liệu lâm sàng. Xóa tài khoản giữ lại hồ sơ và lịch sử y tế; xóa bản ghi loại bỏ cả ảnh nằm trong bản ghi đó. Đây là lựa chọn lưu trữ cho prototype, cần xác nhận trước khi làm backend.

## Tham khảo MediScan

MediScan hiện có `app/`, `components/auth/`, `components/dashboard/`, `components/ui/`, `config/dashboard.tsx`, `hooks/`, `lib/` và Tailwind/CSS variables. Các route như `app/dashboard/patients/page.tsx` ghép `DashboardShell` với component nghiệp vụ. Navigation dùng Next Link và usePathname. UI dùng functional component, export có tên và TypeScript.

Áp dụng các mẫu chia component, shell/header/nav, card/form/table/dialog, upload/results, alias import và biến màu. Viết mới component cho nghiệp vụ Silicosis; không sao chép logic pneumonia, gọi backend thật, auth thật, batch/comparison hay component kết quả lớn của MediScan. Dự án mới dùng Tailwind 4 và Next 16 theo tài liệu trong package đang cài.

## Cấu trúc

```text
components/
  common/       Button, Input, Modal, Table, Loading, Feedback, Card, Badge, PageHeader
  layout/       Header, Sidebar, MainLayout
  auth/         AuthLayout, LoginForm, RegisterForm
  dashboard/    DashboardOverview, StatCards, ResultDistribution, QuickActions
  patient/      PatientList, PatientTable, PatientForm, PatientCard, PatientDetail, ClinicalRecords
  prediction/   XrayUpload, PredictionWorkspace, PredictionResult, PredictionHistory, XrayViewer
  admin/        UserManagement, AccountForm, RecordEditor
  profile/      ProfileOverview, ProfileForm, PasswordForm
src/
  app/          Chỉ page, layout, routing, route loading/error và style entry
    (workspace)/dashboard, patients, prediction, history, admin, profile
    login/, register/
  constants/    Nhãn vai trò, menu, cấu hình demo
  contexts/     AuthContext
  data/         mockData.ts
  hooks/        useAsync
  services/     auth, user, patient, prediction, clinical, image, dashboard, report, mockStore
  styles/       CSS base, layout, auth, workspace và responsive
  types/        user, patient, prediction, database
  utils/        validation, format
public/
  images/       Ảnh minh họa có nhãn demo
  templates/    Mẫu nhập dữ liệu CSV
```

`@/components/*` trỏ đến `components/*` ở gốc. Các import `@/*` khác trỏ đến `src/*`. Route group `(workspace)` chia sẻ một layout mà không thay đổi URL. Mỗi page chỉ ghép component; dynamic params và searchParams được await theo Next 16.

`src/app/globals.css` chỉ là entry import Tailwind và các stylesheet trong `src/styles`. Các component lớn được chia thêm thành `UserTable`, `ClinicalRecordRow`, `HistoryFilters`, `HistoryTable`, `MedicalReviewForm` để tách phần hiển thị khỏi điều phối trạng thái.

## Luồng dữ liệu và trạng thái

Xác thực: Component → `authService` → `src/lib/apiClient.ts` → backend. `apiClient` gắn Bearer token, khi gặp 401 thì refresh đúng một lần (các request đồng thời dùng chung một promise, các tab xếp hàng qua Web Lock vì refresh token xoay vòng) rồi gửi lại; refresh thất bại thì xoá phiên và về `/login`. Chuyển đổi dữ liệu user backend ↔ web (vai trò `USER`/`ADMIN` ↔ `patient`/`admin`, `fullName` ↔ `name`, `enabled` ↔ `active`, giới tính) chỉ nằm trong `src/services/userMapper.ts`.

Các phần còn lại: Component → service async → mockStore → localStorage (khóa `silicosis-demo-v1`). Chỉ tầng service đọc mockData. `mockStore.currentUser()` lấy user đang đăng nhập từ `authService`, nên guard route và service mock vẫn kiểm tra vai trò/phạm vi bệnh nhân; khi nối backend cho các phần này cần thay bằng kiểm tra quyền phía server.

`useAsync` xử lý loading/error/retry và bỏ qua kết quả cũ khi unmount hoặc thay loader. Mutation có trạng thái busy, lỗi và thành công. Các form validate cả trong UI và service. Modal dùng dialog để focus trap, Escape và trả focus. Navigation trên màn hình nhỏ dùng lại Sidebar trong modal.

Các màn hình: `/login`, `/register`, `/dashboard`, `/patients`, `/patients/[id]`, `/prediction`, `/prediction/[id]`, `/history`, `/history/[id]`, `/profile`, `/admin/users`, `/admin/records`. `/` chuyển về tổng quan, `/admin` chuyển về quản lý tài khoản.

Luồng chính: đăng nhập → chọn/tạo hồ sơ → chọn ảnh → nhập/nhập tệp và kiểm tra dữ liệu theo thời gian → xác nhận → dự đoán demo → xem kết quả → lưu lịch sử tự động → bác sĩ đánh giá hoặc xuất PDF. Patient mới đăng ký có hồ sơ rỗng được liên kết tự động.

## Quy ước dữ liệu demo

Tài liệu chưa chốt schema lâm sàng hoặc giới hạn kỹ thuật. Prototype chọn `date`, `exposureYears`, `dustLevel`, `fvc`, `fev1` để trình diễn; đây không phải ngưỡng lâm sàng. Form/import kiểm tra ngày hợp lệ, không ở tương lai, không trùng; tối đa 100 mốc. Hỗ trợ CSV và Excel `.xlsx` sheet đầu; không hỗ trợ `.xls` cũ. Import luôn cho xem trước và xác nhận thay bảng hiện tại.

Ảnh upload hỗ trợ PNG/JPEG ≤10 MB, từ 256×256 và tối đa 40 megapixel. Preview được nén xuống cạnh dài tối đa 900px để lưu demo; không bảo toàn ảnh gốc phục vụ chẩn đoán. Đọc tệp và kiểm tra kích thước thực thi thật trên trình duyệt. Nhận diện đúng loại X-quang, chất lượng ảnh, BioViL-T/fusion và heatmap chỉ mô phỏng; không suy luận từ dữ liệu người dùng.

Các kịch bản chọn được: Normal, Silicosis, ảnh bị từ chối, lỗi mô hình. Chỉ kết quả thành công được lưu. Snapshot dữ liệu theo dõi nằm trong bản ghi, không đổi khi chỉnh hồ sơ về sau. Heatmap luôn ghi rõ là minh họa cố định.

PDF được tạo và tải xuống tại trình duyệt, có tiếng Việt, ảnh, thông tin bệnh nhân, nhãn/xác suất, phiên bản, người thực hiện, toàn bộ mốc dữ liệu, nhận xét và lưu ý. Các trang được rasterize để bảo toàn font tiếng Việt; văn bản PDF không có lớp text để tìm kiếm.

## Nối backend sau này

Giữ API public của các service, thay implementation localStorage bằng HTTP và cơ chế session thật. Chuyển kiểm tra quyền, file validation, inference và persistence sang backend. Thay `XrayImage.url` bằng URL tài nguyên được cấp quyền; trả về heatmap thực. Chốt actor, schema/đơn vị/chỉ số, ngưỡng file và chính sách xóa theo tài liệu nghiệp vụ được duyệt trước khi triển khai thật.
