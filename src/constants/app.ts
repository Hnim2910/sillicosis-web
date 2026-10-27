import type { Role } from "@/types/user";
import type { VisitOutcome } from "@/types/visit";

export const ROLE_LABELS: Record<Role, string> = {
  patient: "Bệnh nhân",
  admin: "Quản trị viên",
};
export const GENDER_LABELS = { male: "Nam", female: "Nữ", other: "Khác" };
export const OUTCOME_LABELS: Record<VisitOutcome, string> = {
  Co: "Nghi bụi phổi silic",
  Khong: "Không phát hiện",
  FAILED: "Dự đoán lỗi",
  NONE: "Chưa dự đoán",
};
/** Vietnamese text for PredictionResponse.errorCode (silicosis-backend/docs/api-visits.md §8). */
export const PREDICTION_ERRORS: Record<string, string> = {
  PREDICT_UNAVAILABLE: "Dịch vụ phân tích ảnh đang không hoạt động. Vui lòng thử lại sau.",
  PREDICT_TIMEOUT: "Dịch vụ phân tích ảnh phản hồi quá lâu. Vui lòng thử lại.",
  PREDICT_IMAGE_REJECTED:
    "Dịch vụ phân tích từ chối ảnh này. Hãy dùng ảnh X-quang ngực rõ nét khác.",
  PREDICT_BAD_RESPONSE: "Dịch vụ phân tích trả về kết quả không hợp lệ. Vui lòng thử lại.",
  PREDICT_IMAGE_UNREADABLE: "Không đọc được ảnh đã lưu. Hãy tải lên ảnh khác.",
};
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const RESULT_NOTICE =
  "Kết quả thử nghiệm, chỉ mang tính sàng lọc tham khảo; cần khám bác sĩ chuyên khoa để được chẩn đoán.";
/** Shown next to every result: the model reads the X-ray only and was validated on a single dataset. */
export const MODEL_SCOPE_NOTICE =
  "Mô hình chỉ đọc ảnh X-quang (các chỉ số lâm sàng được lưu nhưng không dùng để dự đoán) và mới được kiểm định trên một bộ dữ liệu nghiên cứu (Set A), nên có thể sai với ảnh từ nguồn khác.";
