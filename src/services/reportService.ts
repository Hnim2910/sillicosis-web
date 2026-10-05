import type { Patient } from "@/types/patient";
import type { Prediction } from "@/types/prediction";
import { RESULT_NOTICE, REVIEW_LABELS } from "@/constants/app";
import { formatDate } from "@/utils/format";
import { loadImage } from "@/services/imageService";
import { wrapText } from "@/utils/wrapText";

export const reportService = {
  async download(record: Prediction, patient: Patient) {
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
      ctx!.fillText(`SilicoCare · Dữ liệu minh họa · Trang ${page}`, 70, 1708);
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
    line("BÁO CÁO SÀNG LỌC BỤI PHỔI SILIC", 34, true);
    line("BẢN DEMO · KHÔNG PHẢI KẾT QUẢ CHẨN ĐOÁN", 20);
    y += 20;
    line(`Bệnh nhân: ${patient.name} · ${patient.id}`);
    line(
      `Ngày sinh: ${formatDate(patient.birthDate)} · Nghề nghiệp: ${patient.occupation || "Chưa cập nhật"}`,
    );
    line(`Bản ghi: ${record.id} · Thời gian: ${formatDate(record.createdAt, true)}`);
    line(`Người thực hiện: ${record.performedBy}`);
    line(
      `Kết quả mô phỏng: ${record.label} · Độ tin cậy: ${record.confidence.toFixed(1)}%`,
      26,
      true,
    );
    line(`Mô hình: ${record.modelVersion}`, 20);
    y += 15;
    const image = await loadImage(record.image.url);
    const ratio = Math.min(460 / image.naturalWidth, 440 / image.naturalHeight);
    const width = image.naturalWidth * ratio,
      height = image.naturalHeight * ratio;
    if (y + height > 1620) {
      savePage();
      startPage();
    }
    ctx.drawImage(image, 72, y, width, height);
    y += height + 35;
    line("Dữ liệu theo thời gian đã sử dụng", 25, true);
    for (const row of record.clinicalRecords)
      line(
        `${formatDate(row.date)} | Phơi nhiễm: ${row.exposureYears} năm | Bụi: ${row.dustLevel} mg/m³ | FVC: ${row.fvc}% | FEV1: ${row.fev1}%`,
        21,
      );
    y += 15;
    if (record.review) {
      line(`Đánh giá bác sĩ: ${REVIEW_LABELS[record.review.decision]}`, 24, true);
      line(`${record.review.doctorName} · ${formatDate(record.review.reviewedAt, true)}`, 20);
      line(record.review.note, 22);
    } else line("Chưa có đánh giá chuyên môn của bác sĩ.", 22);
    y += 20;
    line(RESULT_NOTICE, 20);
    savePage();
    pdf.save(`SilicoCare-${record.id}.pdf`);
  },
};
