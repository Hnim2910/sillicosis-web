import type { Prediction } from "@/types/prediction";
import {
  CHANCE_LABEL,
  MODEL_LIMITATIONS,
  NO_IMAGE_NOTE,
  OUTCOME_LABELS,
  RESULT_NOTICE,
} from "@/constants/app";
import { predictionOutcome } from "@/services/predictionService";
import { formatDate } from "@/utils/format";
import {
  clinicalRows,
  formatChance,
  formatPercent,
  mainChance,
  resultInsight,
} from "@/utils/predictionDisplay";
import { loadImage } from "@/services/imageService";
import { wrapText } from "@/utils/wrapText";

export const reportService = {
  /** `imageUrl`: object URL of the screening's X-ray (see useImageUrl), null for a clinical-only screening.
   *  Only for a successful prediction. */
  async download(prediction: Prediction, imageUrl: string | null) {
    if (prediction.status !== "SUCCESS") throw new Error("Lượt chẩn đoán chưa có kết quả.");
    const { jsPDF } = await import("jspdf");
    await document.fonts.ready;
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Trình duyệt không hỗ trợ tạo báo cáo.");
    let y = 90;
    let page = 1;
    function startPage() {
      ctx!.fillStyle = "white";
      ctx!.fillRect(0, 0, 1240, 1754);
      ctx!.fillStyle = "#087f77";
      ctx!.fillRect(65, 58, 1110, 5);
      y = 110;
    }
    function savePage() {
      ctx!.font = "18px Arial";
      ctx!.fillStyle = "#85949d";
      ctx!.fillText(`SilicoCare · Kết quả thử nghiệm · Trang ${page}`, 70, 1708);
      if (page > 1) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
      page += 1;
    }
    // Rasterizing each page preserves Vietnamese glyphs without a remote font.
    function line(text: string, size = 23, bold = false) {
      ctx!.font = `${bold ? "bold " : ""}${size}px Arial`;
      const lines = wrapText(text, (value) => ctx!.measureText(value).width, 1090);
      for (const textLine of lines) {
        if (y > 1620) {
          savePage();
          startPage();
          ctx!.font = `${bold ? "bold " : ""}${size}px Arial`;
        }
        ctx!.fillStyle = "#243e4b";
        ctx!.fillText(textLine, 72, y);
        y += size * 1.6;
      }
    }
    startPage();
    line("SILICOCARE", 23, true);
    y += 15;
    line("BÁO CÁO SÀNG LỌC BỤI PHỔI SILIC (THỬ NGHIỆM)", 34, true);
    line("KẾT QUẢ SÀNG LỌC CỦA MÔ HÌNH AI · KHÔNG THAY THẾ CHẨN ĐOÁN CỦA BÁC SĨ", 20);
    y += 20;
    if (prediction.user)
      line(
        `Bệnh nhân: ${prediction.user.fullName}${prediction.user.code ? ` · ${prediction.user.code}` : ""}`,
      );
    line(`Ngày khám: ${formatDate(prediction.examDate)}`);
    const chance = mainChance(prediction);
    line(`Kết quả: ${OUTCOME_LABELS[predictionOutcome(prediction)]}`, 28, true);
    if (chance !== null) line(`${CHANCE_LABEL}: ${formatChance(chance)}`, 24, true);
    else line(NO_IMAGE_NOTE, 21);
    const insight = resultInsight(prediction);
    if (insight) {
      line(`Nhận xét: ${insight.comment}`, 21);
      line("Lời khuyên:", 21, true);
      for (const advice of insight.advice) line(`• ${advice}`, 21);
    }
    line(
      `Mô hình: ${prediction.modelName || "Không rõ"} · Phiên bản ${prediction.modelVersion} · Chẩn đoán lúc ${formatDate(prediction.createdAt, true)}`,
      20,
    );
    y += 15;
    if (imageUrl) {
      const image = await loadImage(imageUrl);
      const ratio = Math.min(460 / image.naturalWidth, 440 / image.naturalHeight);
      const width = image.naturalWidth * ratio,
        height = image.naturalHeight * ratio;
      if (y + height > 1620) {
        savePage();
        startPage();
      }
      ctx.drawImage(image, 72, y, width, height);
      y += height + 35;
    } else {
      y += 15;
    }
    const rows = clinicalRows(prediction);
    line("Thông tin lâm sàng", 25, true);
    if (!rows.length) line("Không nhập thông tin lâm sàng.", 21);
    for (const [label, value] of rows) line(`${label}: ${value}`, 21);
    y += 20;
    line("Chi tiết kỹ thuật", 20, true);
    line(
      `Điểm lâm sàng ${formatPercent(prediction.pLamSang ?? 0)} (ngưỡng ${formatPercent(prediction.nguongLamSang ?? 0)})`,
      18,
    );
    if (prediction.coAnh)
      line(
        `Điểm ảnh ${formatPercent(prediction.pAnh ?? 0)} · Điểm ghép ${formatPercent(prediction.pGhep ?? 0)} (ngưỡng ${formatPercent(prediction.nguongGhep ?? 0)})`,
        18,
      );
    y += 15;
    line(prediction.disclaimer, 20, true);
    for (const limit of MODEL_LIMITATIONS) line(`• ${limit}`, 20);
    line(RESULT_NOTICE, 20);
    savePage();
    pdf.save(`SilicoCare-${prediction.user?.code || "ket-qua"}-${prediction.examDate}.pdf`);
  },
};
