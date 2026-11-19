// "Hiểu về kết quả" on the dashboard. Written for patients; to be reviewed by the medical member of the team.
// Deliberately no reference ranges per label: there is no validated source for them yet (team decision).

export interface ResultGuideSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface ResultGuide {
  outcome: "Co" | "Khong";
  title: string;
  summary: string;
  /** Short version for the result page; the full sections are on the dashboard ("Xem chi tiết"). */
  overview: { health: string; context: string; advice: string };
  sections: ResultGuideSection[];
}

export const RESULT_GUIDES: ResultGuide[] = [
  {
    outcome: "Co",
    title: "Có nguy cơ",
    summary:
      "Dữ liệu của bạn có những đặc điểm mà mô hình thường gặp ở người mắc bụi phổi silic. Đây là kết quả sàng lọc, cần bác sĩ chuyên khoa khám và làm thêm xét nghiệm để khẳng định hoặc loại trừ bệnh.",
    overview: {
      health:
        "Xơ hóa phổi do hít bụi silic lâu ngày, tiến triển âm thầm và không hồi phục. Người bệnh thường ho khan kéo dài, khó thở khi gắng sức và dễ mắc thêm lao phổi, bệnh phổi tắc nghẽn.",
      context:
        "Hay gặp ở thợ khai thác, nghiền, cắt mài đá, sản xuất xi măng, gốm sứ, đúc kim loại, xây dựng. Nguy cơ tăng khi tuổi nghề dài, làm khô, thông gió kém, thiếu bảo hộ và hút thuốc.",
      advice:
        "Khám chuyên khoa hô hấp hoặc bệnh nghề nghiệp sớm để đọc phim theo chuẩn ILO và đo chức năng hô hấp. Đeo khẩu trang N95/P2, ngừng hút thuốc, giữ hồ sơ khám để giám định khi cần.",
    },
    sections: [
      {
        title: "Tình trạng sức khỏe",
        paragraphs: [
          "Bụi phổi silic là tình trạng xơ hóa phổi do hít phải bụi chứa silic tự do (SiO₂) trong thời gian dài. Các hạt bụi đọng lại trong phế nang, gây viêm và tạo các nốt xơ; theo thời gian, mô phổi mất dần độ đàn hồi và khả năng trao đổi khí.",
          "Bệnh thường tiến triển âm thầm qua nhiều năm. Giai đoạn sớm có thể chưa có triệu chứng; khi tiến triển, người bệnh hay gặp ho khan kéo dài, khó thở khi gắng sức rồi cả khi làm việc nhẹ, tức ngực, mệt mỏi, sụt cân.",
          "Tổn thương xơ hóa không hồi phục, nhưng phát hiện sớm và ngừng tiếp xúc bụi giúp làm chậm tiến triển. Người mắc bụi phổi silic cũng dễ mắc lao phổi, viêm phế quản mạn, bệnh phổi tắc nghẽn mạn tính và ung thư phổi hơn người bình thường, nên cần được theo dõi lâu dài.",
        ],
      },
      {
        title: "Đối tượng và môi trường thường gặp",
        bullets: [
          "Khai thác, nghiền sàng, chế biến đá và cát; cắt, mài, đánh bóng đá ốp lát, đặc biệt là đá thạch anh nhân tạo.",
          "Sản xuất xi măng, gạch chịu lửa, gốm sứ, thủy tinh; đúc kim loại dùng khuôn cát; phun cát làm sạch bề mặt.",
          "Xây dựng, khoan, đục, phá dỡ bê tông, đào hầm và làm đường.",
          "Nguy cơ tăng khi tuổi nghề dài, nồng độ bụi cao, làm khô (không phun nước), nơi làm việc kém thông gió, không đeo khẩu trang hoặc dùng khẩu trang vải, khẩu trang y tế không lọc được bụi mịn.",
          "Hút thuốc lá không gây ra bệnh nhưng làm phổi tổn thương nặng hơn và triệu chứng xuất hiện sớm hơn.",
        ],
      },
      {
        title: "Lời khuyên",
        bullets: [
          "Đi khám chuyên khoa hô hấp hoặc bệnh nghề nghiệp trong vài tuần tới, mang theo kết quả này và phim X-quang (nếu có).",
          "Bác sĩ có thể chỉ định X-quang ngực đọc theo tiêu chuẩn ILO, đo chức năng hô hấp, chụp CT ngực độ phân giải cao và xét nghiệm lao khi cần.",
          "Giảm tối đa tiếp xúc bụi ngay từ bây giờ: đeo khẩu trang lọc bụi đạt chuẩn N95/P2 vừa khít mặt suốt ca làm việc, phun nước khi cắt mài, dùng hệ thống hút bụi; trao đổi với nơi làm việc về việc chuyển sang vị trí ít bụi.",
          "Ngừng hút thuốc lá; hỏi bác sĩ về tiêm phòng cúm và phế cầu để giảm nguy cơ nhiễm trùng hô hấp.",
          "Bụi phổi silic nghề nghiệp nằm trong danh mục bệnh nghề nghiệp được hưởng bảo hiểm xã hội; hãy giữ lại hồ sơ khám và giấy tờ về quá trình làm việc để làm căn cứ giám định khi cần.",
          "Đi khám ngay nếu khó thở tăng nhanh, ho ra máu, sốt hoặc sụt cân kéo dài không rõ lý do.",
        ],
      },
    ],
  },
  {
    outcome: "Khong",
    title: "Nguy cơ thấp",
    summary:
      "Mô hình chưa ghi nhận đặc điểm gợi ý bụi phổi silic trong dữ liệu bạn cung cấp ở lần khám này. Kết quả chỉ phản ánh thời điểm khám và không loại trừ hoàn toàn bệnh.",
    overview: {
      health:
        "Chưa thấy dấu hiệu gợi ý bụi phổi silic ở lần khám này. Bệnh có thể xuất hiện sau khoảng 10 năm tiếp xúc trở lên, kể cả khi đã nghỉ việc, nên kết quả chưa loại trừ hoàn toàn.",
      context:
        "Thường ở người ít tiếp xúc bụi silic, tuổi nghề ngắn, làm việc nơi có phun nước, hút bụi, thông gió tốt, dùng bảo hộ đầy đủ, không hút thuốc và không có triệu chứng hô hấp kéo dài.",
      advice:
        "Khám sức khỏe nghề nghiệp định kỳ 6–12 tháng/lần, có chụp X-quang ngực nếu làm việc với bụi. Tiếp tục đeo khẩu trang lọc bụi, không hút thuốc, đi khám sớm nếu ho kéo dài trên 3 tuần.",
    },
    sections: [
      {
        title: "Tình trạng sức khỏe",
        paragraphs: [
          "Với dữ liệu hiện có, phổi của bạn chưa có dấu hiệu mà mô hình liên hệ với bụi phổi silic. Điều này phù hợp với người chưa có tổn thương phổi do bụi, hoặc tổn thương còn quá nhỏ để thấy được.",
          "Dạng thường gặp của bụi phổi silic xuất hiện sau khoảng 10 năm tiếp xúc trở lên, có khi nhiều năm sau khi đã nghỉ việc. Kết quả sẽ kém chính xác hơn khi chưa có phim X-quang hoặc thông tin lâm sàng còn thiếu, vì vậy việc theo dõi định kỳ vẫn cần thiết nếu bạn từng hoặc đang làm việc trong môi trường có bụi.",
        ],
      },
      {
        title: "Đối tượng và môi trường thường gặp",
        bullets: [
          "Người chưa hoặc ít tiếp xúc bụi chứa silic, hoặc tuổi nghề còn ngắn.",
          "Làm việc ở nơi kiểm soát bụi tốt: có phun nước, hút bụi tại chỗ, thông gió, được đo môi trường lao động định kỳ.",
          "Sử dụng thiết bị bảo hộ đầy đủ và đúng cách trong suốt ca làm việc.",
          "Không có triệu chứng hô hấp kéo dài và không hút thuốc lá.",
        ],
      },
      {
        title: "Lời khuyên",
        bullets: [
          "Nếu đang làm việc với bụi: duy trì khám sức khỏe nghề nghiệp định kỳ (thường 6–12 tháng một lần), có chụp X-quang ngực.",
          "Thực hiện chẩn đoán mới trên hệ thống sau mỗi lần khám để theo dõi xu hướng; nếu lần này chưa có phim, hãy bổ sung phim X-quang ngực thẳng ở lần sau.",
          "Tiếp tục đeo khẩu trang lọc bụi đạt chuẩn N95/P2 và làm ướt vật liệu khi cắt, mài, khoan.",
          "Không hút thuốc lá; tập thể dục đều đặn để duy trì sức khỏe hô hấp.",
          "Đi khám sớm, không chờ lịch định kỳ, nếu ho kéo dài trên 3 tuần, khó thở khi gắng sức, đau ngực hoặc sụt cân không rõ lý do.",
        ],
      },
    ],
  },
];

export const RESULT_GUIDE_NOTE =
  "Thông tin mang tính tham khảo, giúp bạn hiểu kết quả sàng lọc; không thay thế chẩn đoán và tư vấn trực tiếp của bác sĩ.";
