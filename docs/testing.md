# Kiểm thử frontend

Chạy `npm run lint`, `npm run build`, sau đó `npm run test:e2e`.

Playwright mở bản production trên `http://127.0.0.1:3040`, dùng Chrome headless. Mỗi bài kiểm thử trình duyệt có context riêng nên phiên đăng nhập không ảnh hưởng tới trình duyệt của bạn ở cổng 3000.

## Kiểm thử thuần (`tests/unit.spec.ts`)

Không cần trình duyệt hay backend:

- Ngày không tồn tại, năm nhuận, ngày tương lai, sai định dạng.
- Số di động Việt Nam theo đúng quy tắc của backend.
- Form lượt khám: khoảng giá trị, ngày khám không ở tương lai, huyết áp tâm thu > tâm trương, FEV1 ≤ FVC, chuyển chuỗi sang số/`null`.
- Trạng thái kết quả của lượt khám (chưa dự đoán / lỗi / có / không).
- Ngắt dòng văn bản dài khi tạo PDF.
- Màn hình kết quả: % làm tròn, 3 mức nguy cơ khi chỉ có lâm sàng (mốc dưới = `nguong_lam_sang` của response, mốc trên `CLINICAL_HIGH_RISK`).

## Nhập thông tin lâm sàng từ file (`tests/clinicalImport.spec.ts`)

Không cần trình duyệt hay backend; chỉ dùng dữ liệu giả, file .xlsx được dựng ngay trong test.

- JSON (object, mảng, dạng `extra.lam_sang`), CSV (dấu `;`, ô có ngoặc kép, dấu phẩy thập phân, NaN), TXT (`cot: gia_tri`, `cot=gia_tri`), XLSX (nhiều hàng).
- Nhãn có dấu / khác hoa thường đổi về mã không dấu; cột ngoài 63 trường bị bỏ, chỉ đếm số cột.
- Giá trị không hợp lệ để trống và báo theo tên ô (không báo giá trị).
- Câu phụ có giá trị khi câu chính trống hoặc “Không”: giữ trong form, không gửi, báo trong tóm tắt.
- File mẫu `.csv`: đủ 63 cột, hàng ví dụ nhập lại không lỗi.

## Kiểm thử với backend thật (`tests/live.spec.ts`)

Tự bỏ qua khi backend không chạy ở `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:8080`) hoặc thiếu tài khoản kiểm thử. Cần:

1. Backend + dịch vụ dự đoán đang chạy.
2. Thêm origin `http://127.0.0.1:3040` vào CORS backend, ví dụ `APP_CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:3000,http://127.0.0.1:3040`, rồi khởi động lại backend.
3. Đặt biến môi trường trong shell trước khi chạy (xem `.env.example`): `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_PATIENT_EMAIL`, `E2E_PATIENT_PASSWORD`. Dùng tài khoản kiểm thử, không dùng tài khoản của bệnh nhân thật.

Các bài:

- Admin đăng nhập, mở trang tài khoản (không còn nút sửa/đổi vai trò), bệnh nhân, quản lý bản ghi, tổng quan.
- Bệnh nhân chọn ảnh quá nhỏ: bị từ chối ở trình duyệt, không gửi request upload.
- Chỉ khi `E2E_WRITE=1`:
  - Bệnh nhân chỉ nhập lâm sàng (Ho = Có → hiện câu hỏi phụ “Thời điểm ho”, FVC ghi dấu phẩy), không ảnh: thấy câu kết luận mới, không có chữ “dương tính/âm tính”.
  - Bệnh nhân tạo lượt khám với ảnh nhiễu tổng hợp 512×512 (không phải X-quang thật): nút gửi bị khoá cho tới khi tick “Đây là phim X-quang ngực thẳng”; thấy kết quả hoặc lỗi dự đoán có nút thử lại, thấy chỉ số đã nhập và lượt khám trong lịch sử. Nếu có tài khoản admin, bài kiểm thử xoá lượt khám và ảnh tổng hợp đó qua API; không có admin thì dữ liệu kiểm thử được giữ lại.

Ảnh chụp, PDF và trace lỗi nằm trong `test-results/`; chúng không được đưa vào Git. Các kiểm thử chỉ xác nhận hành vi giao diện và việc nối API, không đánh giá độ chính xác y khoa của mô hình AI.
