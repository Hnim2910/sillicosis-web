import type { Role } from "@/types/user";
import type { PredictionOutcome } from "@/types/prediction";

export const ROLE_LABELS: Record<Role, string> = {
  patient: "Bệnh nhân",
  admin: "Quản trị viên",
};
export const GENDER_LABELS = { male: "Nam", female: "Nữ", other: "Khác" };
/** The only three result labels, for screenings with and without an X-ray (team decision). Never
 *  "dương tính"/"âm tính": this is screening only. */
export const OUTCOME_LABELS: Record<PredictionOutcome, string> = {
  Co: "Có nguy cơ",
  Khong: "Nguy cơ thấp",
  FAILED: "Bị lỗi",
};
export const OUTCOME_TONES: Record<PredictionOutcome, "warning" | "success" | "danger"> = {
  Co: "warning",
  Khong: "success",
  FAILED: "danger",
};
/** The percentage is shown only for screenings with an X-ray (fused score p_ghep). */
export const CHANCE_LABEL = "Điểm nguy cơ (ảnh X-quang + lâm sàng)";
/** Shown on every clinical-only result. */
export const NO_IMAGE_NOTE =
  "Kết quả chỉ dựa trên thông tin lâm sàng. Nên bổ sung phim X-quang ngực thẳng để kết quả chính xác và đầy đủ hơn.";
/** Vietnamese text for PredictionResponse.errorCode (silicosis-backend/docs/api-predictions.md). */
export const PREDICTION_ERRORS: Record<string, string> = {
  PREDICT_UNAVAILABLE: "Dịch vụ phân tích đang không hoạt động. Vui lòng thử lại sau.",
  PREDICT_DISABLED: "Chức năng phân tích đang tạm tắt. Vui lòng thử lại sau.",
  PREDICT_TIMEOUT: "Dịch vụ phân tích phản hồi quá lâu. Vui lòng thử lại.",
  PREDICT_IMAGE_REJECTED:
    "Dịch vụ phân tích từ chối ảnh này. Hãy dùng ảnh X-quang ngực thẳng rõ nét khác.",
  PREDICT_BAD_RESPONSE: "Dịch vụ phân tích trả về kết quả không hợp lệ. Vui lòng thử lại.",
  PREDICT_IMAGE_UNREADABLE: "Không đọc được ảnh đã lưu. Hãy tải lên ảnh khác.",
  PREDICT_INVALID_INPUT:
    "Thông tin lâm sàng có giá trị mô hình không nhận. Hãy kiểm tra lại các ô đã nhập.",
};
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const RESULT_NOTICE =
  "Kết quả thử nghiệm, chỉ mang tính sàng lọc tham khảo; cần khám bác sĩ chuyên khoa để được chẩn đoán.";
/** Limits of the New Way model, shown next to every result and in the PDF report.
 *  No comparison with the training data or an average is shown anywhere (user's decision). */
export const MODEL_LIMITATIONS = [
  "Đây là công cụ hỗ trợ sàng lọc; kết quả không thay thế chẩn đoán và đánh giá của bác sĩ.",
  "Khi có phim X-quang ngực thẳng, kết luận chủ yếu dựa vào ảnh.",
  "Khi chỉ có thông tin lâm sàng, kết quả mang tính gợi ý có nên chụp phim hay không, chưa phải nghi bệnh.",
];
export const MODEL_SCOPE_NOTICE = MODEL_LIMITATIONS.join(" ");
