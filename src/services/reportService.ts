import type { Visit } from "@/types/visit";
import { MODEL_SCOPE_NOTICE, OUTCOME_LABELS, RESULT_NOTICE } from "@/constants/app";
import { formatDate } from "@/utils/format";
import { clinicalRows, formatPercent } from "@/utils/visitDisplay";
import { loadImage } from "@/services/imageService";
import { wrapText } from "@/utils/wrapText";

export const reportService = {
  /** `imageUrl`: object URL of the visit's X-ray (see useImageUrl). Only for a successful prediction. */
  async download(visit: Visit, imageUrl: string) {
    const prediction = visit.latestPrediction;
    if (prediction?.status !== "SUCCESS") throw new Error("Lượt khám chưa có kết quả dự đoán.");
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
    line("KẾT QUẢ CỦA MÔ HÌNH AI · KHÔNG PHẢI KẾT QUẢ CHẨN ĐOÁN", 20);
    y += 20;
    line(`Bệnh nhân: ${visit.patient.fullName} · ${visit.patient.code}`);
    line(`Ngày khám: ${formatDate(visit.visitDate)}`);
    line(
      `Kết quả: ${OUTCOME_LABELS[prediction.label === "Co" ? "Co" : "Khong"]} · Xác suất bụi phổi silic: ${formatPercent(prediction.probability ?? 0)} (ngưỡng ${formatPercent(prediction.threshold ?? 0)})`,
      26,
      true,
    );
    line(
      `Mô hình: ${prediction.modelName || "Không rõ"} · Phiên bản ${prediction.modelVersion} · Dự đoán lúc ${formatDate(prediction.createdAt, true)}`,
      20,
    );
    y += 15;
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
    const rows = clinicalRows(visit);
    line("Thông tin lượt khám (lưu để theo dõi, mô hình không sử dụng)", 25, true);
    if (!rows.length) line("Không nhập chỉ số lâm sàng.", 21);
    for (const [label, value] of rows) line(`${label}: ${value}`, 21);
    y += 20;
    line(prediction.disclaimer, 20, true);
    line(MODEL_SCOPE_NOTICE, 20);
    line(RESULT_NOTICE, 20);
    savePage();
    pdf.save(`SilicoCare-${visit.patient.code}-${visit.visitDate}.pdf`);
  },
};
