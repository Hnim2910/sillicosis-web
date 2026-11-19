import type { Prediction } from "@/types/prediction";
import { predictionOutcome } from "@/services/predictionService";
import { OUTCOME_LABELS, PREDICTION_ERRORS } from "@/constants/app";
import { CLINICAL_FIELDS } from "@/constants/clinicalFields";
import type { ClinicalField } from "@/constants/clinicalFields";

const numberFormat = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
  useGrouping: false,
});

/** 0.403 → "40,3%". */
export function formatPercent(value: number) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value * 100)}%`;
}

/** Whole percent for the main number: 0.163 → "16%", below 1% → "<1%". */
export function formatChance(value: number) {
  const percent = value * 100;
  return percent < 1 ? "<1%" : `${Math.round(percent)}%`;
}

/** Headline percentage: only for a successful screening with an X-ray (fused score). Clinical-only results show the
 *  label alone (team decision). */
export function mainChance(prediction: Prediction): number | null {
  if (prediction.status !== "SUCCESS" || !prediction.coAnh) return null;
  return prediction.pGhep;
}

/** Short result for tables: the label, plus the percentage with an X-ray. */
export function shortResult(prediction: Prediction) {
  const label = OUTCOME_LABELS[predictionOutcome(prediction)];
  const chance = mainChance(prediction);
  return chance === null ? label : `${label} · ${formatChance(chance)}`;
}

export function predictionErrorText(prediction: Prediction) {
  return (
    PREDICTION_ERRORS[prediction.errorCode || ""] ||
    "Không thể phân tích lúc này. Vui lòng thử lại sau."
  );
}

/** Display text of one clinical value: the option's label, a Vietnamese number, plus the unit. */
export function formatClinicalValue(field: ClinicalField, value: string | number): string {
  const shown =
    field.kind === "muc"
      ? (field.options?.find((option) => option.code === String(value))?.label ?? String(value))
      : field.kind === "so" && typeof value === "number"
        ? numberFormat.format(value)
        : String(value);
  return field.unit ? `${shown} ${field.unit}` : shown;
}

/** Label → value for every clinical value sent with the screening, in form order. */
export function clinicalRows(prediction: Prediction): [string, string][] {
  const values = prediction.lamSang ?? {};
  const rows: [string, string][] = [];
  for (const field of CLINICAL_FIELDS) {
    const value = values[field.key];
    if (value === undefined || value === null || value === "") continue;
    rows.push([field.label, formatClinicalValue(field, value)]);
  }
  return rows;
}

// ---------- comment and advice ----------

const SYMPTOMS: [string, string][] = [
  ["ho", "ho"],
  ["khacdom", "khạc đờm"],
  ["khotho", "khó thở"],
  ["daunguc", "đau ngực"],
  ["khokhe", "khò khè"],
  ["sutcan", "sụt cân"],
  ["metmoi", "mệt mỏi"],
];

function number(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** What the person reported that matters for dust-related lung disease; facts only, no interpretation. */
export function recordedFactors(prediction: Prediction) {
  const values = prediction.lamSang ?? {};
  const symptoms = SYMPTOMS.filter(([key]) => values[key] === "Co").map(([, label]) => label);
  const years = number(values.tuoinghe);
  return {
    symptoms,
    smoking: values.hutthuoc === "Co hut thuoc",
    yearsInJob: years !== null && years > 0 ? years : null,
  };
}

function joinVi(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} và ${items[items.length - 1]}`;
}

export interface ResultInsight {
  /** One or two sentences on what the result means for this screening. */
  comment: string;
  /** Concrete next steps, most important first. */
  advice: string[];
}

/**
 * Comment and advice for a successful screening, worded from what was actually sent: whether there was an X-ray,
 * where the score sits against the model's own threshold, and the symptoms / smoking / years in the job recorded.
 */
export function resultInsight(prediction: Prediction): ResultInsight | null {
  if (prediction.status !== "SUCCESS") return null;
  const atRisk = !!prediction.ketLuanCuoi;
  const withImage = !!prediction.coAnh;
  const { symptoms, smoking, yearsInJob } = recordedFactors(prediction);

  const facts: string[] = [];
  if (yearsInJob !== null) facts.push(`tuổi nghề ${numberFormat.format(yearsInJob)} năm`);
  if (symptoms.length) facts.push(`có ${joinVi(symptoms)}`);
  if (smoking) facts.push("đang hút thuốc");
  const factText = facts.length ? ` Thông tin ghi nhận: ${joinVi(facts)}.` : "";

  let comment: string;
  if (withImage) {
    const score = formatChance(prediction.pGhep ?? 0);
    const threshold = formatChance(prediction.nguongGhep ?? 0);
    comment = atRisk
      ? `Điểm nguy cơ từ phim X-quang và thông tin lâm sàng là ${score}, cao hơn ngưỡng sàng lọc ${threshold}. Phim có đặc điểm mà mô hình thường gặp ở người mắc bụi phổi silic; cần bác sĩ chuyên khoa đọc phim để xác nhận.${factText}`
      : `Điểm nguy cơ từ phim X-quang và thông tin lâm sàng là ${score}, thấp hơn ngưỡng sàng lọc ${threshold}. Mô hình chưa thấy đặc điểm gợi ý bụi phổi silic trên phim ở lần khám này.${factText}`;
  } else {
    comment = atRisk
      ? `Thông tin lâm sàng của bạn có nhiều điểm tương đồng với nhóm người cần chụp phim X-quang để kiểm tra bụi phổi silic. Kết quả này chưa dựa trên phim nên chưa đủ để kết luận có tổn thương phổi.${factText}`
      : `Thông tin lâm sàng hiện chưa có dấu hiệu gợi ý cần chụp phim ngay. Kết quả này chưa dựa trên phim X-quang nên không loại trừ được tổn thương phổi giai đoạn sớm.${factText}`;
  }

  const advice: string[] = [];
  if (atRisk && withImage)
    advice.push(
      "Đặt lịch khám chuyên khoa hô hấp hoặc bệnh nghề nghiệp trong 2–4 tuần tới, mang theo phim X-quang và kết quả này.",
      "Đề nghị bác sĩ đọc phim theo tiêu chuẩn ILO và đo chức năng hô hấp (hô hấp ký) để đánh giá mức độ.",
    );
  else if (atRisk)
    advice.push(
      "Chụp X-quang ngực thẳng tại cơ sở y tế trong 2–4 tuần tới, rồi thực hiện chẩn đoán mới có kèm phim để có kết quả đầy đủ.",
      "Mang kết quả này khi khám chuyên khoa hô hấp hoặc bệnh nghề nghiệp để bác sĩ chỉ định thêm xét nghiệm nếu cần.",
    );
  else if (withImage)
    advice.push(
      "Tiếp tục khám sức khỏe nghề nghiệp định kỳ (thường 6–12 tháng một lần với người làm việc trong môi trường bụi), có chụp X-quang ngực.",
    );
  else
    advice.push(
      "Khi có điều kiện, chụp X-quang ngực thẳng và thực hiện chẩn đoán mới có kèm phim để kết quả chính xác hơn.",
      "Tiếp tục khám sức khỏe nghề nghiệp định kỳ theo lịch của nơi làm việc.",
    );
  if (!atRisk && symptoms.length)
    advice.push(
      `Bạn có ghi nhận ${joinVi(symptoms)}: nên khám hô hấp để tìm nguyên nhân, không cần chờ tới lịch khám định kỳ.`,
    );
  advice.push(
    "Trong môi trường có bụi: đeo khẩu trang lọc bụi đạt chuẩn N95/P2 vừa khít mặt suốt ca làm việc; ưu tiên cắt, mài ướt và hút bụi tại chỗ.",
  );
  if (smoking)
    advice.push(
      "Ngừng hút thuốc lá: thuốc lá cộng thêm bụi silic làm phổi tổn thương nặng và nhanh hơn.",
    );
  advice.push(
    atRisk
      ? "Đi khám ngay nếu khó thở tăng nhanh, ho ra máu, sốt hoặc sụt cân kéo dài không rõ lý do."
      : "Đi khám sớm nếu ho kéo dài trên 3 tuần, khó thở khi gắng sức hoặc đau ngực.",
  );
  return { comment, advice };
}

/**
 * Short version for the dashboard card, sized so the card always fits the first screen: two sentences and two
 * concrete actions (about 230 + 2 × 110 characters at most). The full comment and advice stay on the result page.
 */
export function resultBrief(prediction: Prediction): ResultInsight | null {
  if (prediction.status !== "SUCCESS") return null;
  const atRisk = !!prediction.ketLuanCuoi;
  const withImage = !!prediction.coAnh;
  const { symptoms, smoking } = recordedFactors(prediction);
  const protect = smoking
    ? "Ngừng hút thuốc lá và đeo khẩu trang lọc bụi N95/P2 suốt ca làm việc."
    : "Đeo khẩu trang lọc bụi N95/P2 vừa khít mặt suốt ca làm việc có bụi.";
  const symptomCheck = symptoms.length
    ? `Khám hô hấp sớm vì đang có ${joinVi(symptoms.slice(0, 2))}, không chờ lịch định kỳ.`
    : null;

  if (withImage) {
    const score = formatChance(prediction.pGhep ?? 0);
    const threshold = formatChance(prediction.nguongGhep ?? 0);
    return atRisk
      ? {
          comment: `Điểm nguy cơ ${score} cao hơn ngưỡng sàng lọc ${threshold}: phim và thông tin lâm sàng có đặc điểm gợi ý bụi phổi silic. Cần bác sĩ chuyên khoa đọc phim và đo chức năng hô hấp để xác nhận.`,
          advice: [
            "Khám chuyên khoa hô hấp hoặc bệnh nghề nghiệp trong 2–4 tuần, mang theo phim và kết quả này.",
            protect,
          ],
        }
      : {
          comment: `Điểm nguy cơ ${score} thấp hơn ngưỡng sàng lọc ${threshold}: chưa ghi nhận đặc điểm gợi ý bụi phổi silic trên phim lần này. Bệnh có thể xuất hiện muộn nên vẫn cần theo dõi định kỳ.`,
          advice: [
            symptomCheck ??
              "Khám sức khỏe nghề nghiệp định kỳ 6–12 tháng/lần, kèm chụp X-quang ngực.",
            protect,
          ],
        };
  }
  return atRisk
    ? {
        comment:
          "Thông tin lâm sàng có nhiều điểm tương đồng với nhóm người cần kiểm tra bụi phổi silic. Kết quả chưa dựa trên phim nên chưa đủ để kết luận có tổn thương phổi.",
        advice: [
          "Chụp X-quang ngực thẳng trong 2–4 tuần rồi thực hiện chẩn đoán mới kèm phim.",
          protect,
        ],
      }
    : {
        comment:
          "Thông tin lâm sàng hiện chưa gợi ý nguy cơ cần chụp phim ngay. Kết quả chưa dựa trên phim X-quang nên chưa loại trừ được tổn thương phổi giai đoạn sớm.",
        advice: [
          symptomCheck ?? "Bổ sung phim X-quang ngực thẳng ở lần khám tới để kết quả đầy đủ hơn.",
          protect,
        ],
      };
}
