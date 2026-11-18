import type { Role } from "@/types/user";
import type { PredictionOutcome } from "@/types/prediction";

export const ROLE_LABELS: Record<Role, string> = {
  patient: "Bệnh nhân",
  admin: "Quản trị viên",
};
export const GENDER_LABELS = { male: "Nam", female: "Nữ", other: "Khác" };
/** Short labels for lists and the dashboard; never "dương tính"/"âm tính" (screening only). */
export const OUTCOME_LABELS: Record<PredictionOutcome, string> = {
  Co: "Có nguy cơ",
  Khong: "Nguy cơ thấp",
  FAILED: "Dự đoán lỗi",
};
/** Recommendation under the main percentage; driven by the model's own flags (ket_luan_cuoi). */
export const RECOMMENDATION_TEXT = {
  imageAtRisk: "Khuyến nghị: nên đọc phim chuyên khoa / khám chuyên sâu.",
  low: "Nguy cơ thấp theo mô hình.",
};
export const CHANCE_LABEL = "Khả năng có bất thường trên phim phổi";

/** Upper risk band for clinical-only results (p_lam_sang). Mốc lấy từ OOF dev bước 6 (New Way), khoảng 10% người
 *  có điểm cao nhất; không dùng tập test. The lower band edge is nguong_lam_sang from each response, never hardcoded. */
export const CLINICAL_HIGH_RISK = 0.15;

export type ClinicalRiskLevel = "low" | "medium" | "high";

/** Shown instead of a percentage when there is no X-ray (user's decision). */
export const CLINICAL_RISK_TEXT: Record<ClinicalRiskLevel, { label: string; advice: string }> = {
  low: { label: "Nguy cơ thấp", advice: "Chưa cần chụp phim ngay, theo dõi định kỳ." },
  medium: { label: "Nguy cơ trung bình", advice: "Khuyến nghị: nên chụp X-quang ngực." },
  high: { label: "Nguy cơ cao", advice: "Khuyến nghị: nên chụp X-quang ngực sớm." },
};
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
  "Đây là công cụ hỗ trợ sàng lọc, không phải chẩn đoán; không thay thế đánh giá của bác sĩ.",
  "Khi có phim X-quang ngực thẳng, kết luận chủ yếu dựa vào ảnh.",
  "Khi chỉ có thông tin lâm sàng, kết quả mang tính gợi ý đi chụp phim, chưa phải nghi bệnh.",
];
export const MODEL_SCOPE_NOTICE = MODEL_LIMITATIONS.join(" ");
