# Kiến trúc frontend SilicoCare

## Nguồn nghiệp vụ và vai trò

Xây dựng theo `Nghiệp vụ.docx`. Backend hiện có hai vai trò; web ánh xạ `USER` → `patient`, `ADMIN` → `admin` (chỉ trong `src/services/userMapper.ts`).

| Vai trò   | Phạm vi                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Khách     | Đăng ký tài khoản bệnh nhân, đăng nhập, quên mật khẩu                                                                         |
| Bệnh nhân | Hồ sơ cá nhân, đổi mật khẩu, cập nhật hồ sơ bệnh nhân của mình, tạo lượt khám kèm ảnh, xem kết quả/lịch sử của mình, xuất PDF |
| Admin     | Tạo/khoá/mở khoá/xoá tài khoản bệnh nhân (không tự khoá/xoá mình), xem/sửa hồ sơ bệnh nhân, tra cứu và xoá lượt khám          |

Vai trò Bác sĩ, Kỹ thuật viên, đánh giá chuyên môn, ghi chú/đánh giá bản ghi và XAI chưa có ở backend nên đã ẩn khỏi giao diện.

## Tham khảo MediScan

MediScan hiện có `app/`, `components/auth/`, `components/dashboard/`, `components/ui/`, `config/dashboard.tsx`, `hooks/`, `lib/` và Tailwind/CSS variables. Các route như `app/dashboard/patients/page.tsx` ghép `DashboardShell` với component nghiệp vụ. Navigation dùng Next Link và usePathname. UI dùng functional component, export có tên và TypeScript.

Áp dụng các mẫu chia component, shell/header/nav, card/form/table/dialog, upload/results, alias import và biến màu. Viết mới component cho nghiệp vụ Silicosis; không sao chép logic pneumonia, gọi backend thật, auth thật, batch/comparison hay component kết quả lớn của MediScan. Dự án mới dùng Tailwind 4 và Next 16 theo tài liệu trong package đang cài.

## Cấu trúc

```text
components/
  common/       Button, Input, Modal, Table, Loading, Feedback, Card, Badge, PageHeader
  layout/       Header, Sidebar, MainLayout
  auth/         AuthLayout, LoginForm, RegisterForm, ForgotPasswordForm
  dashboard/    DashboardOverview, StatCards, ResultDistribution, QuickActions
  patient/      PatientList, PatientTable, PatientForm, PatientCard, PatientDetail
  prediction/   PredictionWorkspace, VisitFields, XrayUpload, XrayViewer, PredictionResult, PredictionHistory
  admin/        UserManagement, UserTable, AccountForm
  profile/      ProfileOverview, ProfileForm, PasswordForm
src/
  app/          Chỉ page, layout, routing, route loading/error và style entry
  constants/    Nhãn vai trò/kết quả, menu, thông báo
  contexts/     AuthContext
  hooks/        useAsync, useImageUrl
  lib/          apiClient
  services/     auth, userMapper, user, patient, visit, image, dashboard, report
  styles/       CSS base, layout, auth, workspace và responsive
  types/        user, patient, visit
  utils/        validation, format, visitForm, visitDisplay, wrapText
```

`@/components/*` trỏ đến `components/*` ở gốc. Các import `@/*` khác trỏ đến `src/*`. Route group `(workspace)` chia sẻ một layout mà không thay đổi URL.

## Luồng dữ liệu

Component → service → `src/lib/apiClient.ts` → backend. `apiClient` gắn Bearer token, khi gặp 401 thì refresh đúng một lần (các request đồng thời dùng chung một promise, các tab xếp hàng qua Web Lock vì refresh token xoay vòng) rồi gửi lại; refresh thất bại thì xoá phiên và về `/login`. Lỗi backend thành `ApiError` (mã lỗi, `fieldErrors`, `details`). `apiAllPages` đọc hết các trang (100 bản ghi/trang, tối đa 50 trang).

Mỗi service giữ kiểu dữ liệu backend ở nội bộ và trả kiểu của web (`Patient`, `Visit`, `User`). Kiểm tra quyền và dữ liệu cuối cùng do backend quyết định; web kiểm tra trước cùng quy tắc để báo lỗi sớm (`validation.ts`, `visitForm.ts`).

Ảnh: `imageService.prepare` kiểm tra định dạng/kích thước ở trình duyệt, `upload` gửi multipart (ảnh trùng → dùng lại id cũ), `contentUrl` tải ảnh có token thành object URL; `useImageUrl` giải phóng URL khi đổi ảnh.

Lượt khám: tạo lượt khám kèm `imageId` thì backend tự chạy chẩn đoán. `POST /api/visits/{id}/predictions` chạy lại; dịch vụ chẩn đoán lỗi vẫn trả 201 với trạng thái `FAILED` và mã lỗi được dịch sang tiếng Việt (`PREDICTION_ERRORS`).

Các màn hình: `/login`, `/register`, `/forgot-password`, `/dashboard`, `/patients`, `/patients/[id]`, `/prediction`, `/prediction/[id]`, `/history`, `/history/[id]`, `/profile`, `/admin/users`, `/admin/records`. `/prediction/[id]` và `/history/[id]` cùng hiển thị một lượt khám theo id.

## Báo cáo PDF

Tạo ở trình duyệt khi lượt khám có kết quả thành công: thông tin bệnh nhân, ngày khám, ảnh, nhãn/xác suất/ngưỡng, mô hình và phiên bản, các chỉ số đã nhập, lưu ý. Các trang được rasterize để giữ font tiếng Việt nên PDF không có lớp text tìm kiếm được.
