# Kiểm thử frontend

Chạy `npm run lint`, `npm run build`, sau đó `npm run test:e2e`.

Playwright mở bản production trên cổng 3040, dùng Chrome headless. Mỗi bài kiểm thử trình duyệt có context riêng để dữ liệu localStorage và phiên đăng nhập không ảnh hưởng lẫn nhau hoặc thay đổi dữ liệu demo của người dùng ở cổng 3000.

## Đăng nhập bằng mock data

`tests/auth.spec.ts` kiểm tra cả bốn role đăng nhập thủ công, giữ phiên sau khi tải lại, đăng xuất và không có request `/api/` hay khung chọn tài khoản demo.

## Luồng nghiệp vụ

`tests/workflows.spec.ts` kiểm tra:

- Đăng nhập sai/đúng, chuyển trang và quyền truy cập.
- Tạo, sửa, tìm kiếm bệnh nhân và giữ dữ liệu sau khi tải lại trang.
- Upload ảnh, kiểm tra định dạng, lỗi mô hình, dự đoán thành công, XAI minh họa và ghi chú bác sĩ.
- Nhập CSV/Excel, xem trước, xác nhận và kiểm tra mốc thời gian trùng.
- Đăng ký bằng email hoặc số điện thoại, cập nhật hồ sơ và đổi mật khẩu.
- Giới hạn dữ liệu theo bệnh nhân; tài khoản bị khóa không thể đăng nhập.
- Tạo tài khoản, từ chối thông tin trùng, sửa ghi chú/đánh giá và xác nhận xóa bản ghi.
- Menu trên mobile, bố cục tablet và trang không tràn ngang sau khi tải xong dữ liệu.
- Tải báo cáo PDF từ kết quả dự đoán.

## Các trường hợp hồi quy

`tests/regressions.spec.ts` kiểm tra:

- Ngày không tồn tại, năm nhuận, ngày tương lai và kiểu ngày không đúng.
- Ô Excel kiểu boolean hoặc bị bỏ trống không được chuyển thành chỉ số hợp lệ.
- Giữ nguyên ngày sinh ở múi giờ phía sau UTC.
- Tìm kiếm tên bắt đầu bằng Đ bằng chữ không dấu hoặc chữ hoa.
- Mở khóa, thay đổi vai trò và xóa tài khoản có hiệu lực khi đăng nhập lại.
- Dự đoán bị từ chối không tạo bản ghi mới.
- Ngắt dòng ghi chú dài, giữ đoạn văn và xuất PDF nhiều trang có cấu trúc hoàn chỉnh.

Ảnh chụp, PDF và trace lỗi nằm trong `test-results/`; chúng không được đưa vào Git. Các kiểm thử chỉ xác nhận hành vi của frontend và mock service, không đánh giá độ chính xác y khoa của mô hình AI hay tính bảo mật của backend thực.
