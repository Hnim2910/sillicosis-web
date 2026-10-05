import type { Role } from "@/types/user";
import type { PredictionScenario, ReviewDecision } from "@/types/prediction";

export const ROLE_LABELS: Record<Role, string> = {
  patient: "Bệnh nhân",
  doctor: "Bác sĩ",
  technician: "Kỹ thuật viên",
  admin: "Quản trị viên",
};
export const GENDER_LABELS = { male: "Nam", female: "Nữ", other: "Khác" };
export const REVIEW_LABELS: Record<ReviewDecision, string> = {
  agree: "Đồng ý với kết quả AI",
  disagree: "Không đồng ý",
  further_testing: "Yêu cầu kiểm tra thêm",
};
export const SCENARIO_LABELS: Record<PredictionScenario, string> = {
  silicosis: "Trả về Silicosis",
  normal: "Trả về Normal",
  invalid_image: "Từ chối ảnh không phù hợp",
  model_error: "Lỗi mô hình",
};
export const CLINICAL_COLUMNS = ["date", "exposureYears", "dustLevel", "fvc", "fev1"] as const;
export const MODEL_VERSION = "BioViL-T · fusion-demo-1.0";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const RESULT_NOTICE =
  "Kết quả chỉ mang tính sàng lọc, tham khảo; cần khám bác sĩ chuyên khoa để được chẩn đoán. Bản demo không phân tích ảnh bằng AI thật.";
