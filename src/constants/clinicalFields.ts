// Clinical fields of the New Way model (label "ketqua"). Keys and option codes are exactly the column names and the
// unaccented level codes of silicosis-backend/predict/ml/new_way/MO_TA_API.md; only the labels carry diacritics.
// Job level, province, blocks A–F, B2 and B10 are not model inputs and are deliberately absent.

/** `so` = number, `chu` = free text, `muc` = one of `options` (code sent as is). */
export type ClinicalKind = "so" | "chu" | "muc";

export interface ClinicalOption {
  code: string;
  label: string;
}

export interface ClinicalField {
  key: string;
  label: string;
  kind: ClinicalKind;
  options?: ClinicalOption[];
  unit?: string;
  hint?: string;
  /** Follow-up question: shown (and sent) only when `parent` has the value `when`. */
  parent?: { key: string; when: string };
}

export interface ClinicalGroup {
  title: string;
  fields: ClinicalField[];
}

const opt = (...pairs: [string, string][]): ClinicalOption[] =>
  pairs.map(([code, label]) => ({ code, label }));

const CO_KHONG = opt(["Co", "Có"], ["Khong", "Không"]);
const THOI_DIEM = opt(["Ban ngay", "Ban ngày"], ["Ban dem", "Ban đêm"], ["Ca ngay va dem", "Cả ngày và đêm"]);
const BT_GIAM = opt(["Binh thuong", "Bình thường"], ["Giam", "Giảm"]);

const yes = (key: string) => ({ key, when: "Co" });
const num = (key: string, label: string, unit?: string, hint?: string): ClinicalField => ({
  key,
  label,
  kind: "so",
  unit,
  hint,
});
const text = (key: string, label: string, hint?: string): ClinicalField => ({ key, label, kind: "chu", hint });
const pick = (key: string, label: string, options: ClinicalOption[]): ClinicalField => ({
  key,
  label,
  kind: "muc",
  options,
});
const follow = (field: ClinicalField, parent: { key: string; when: string }): ClinicalField => ({
  ...field,
  parent,
});

export const CLINICAL_GROUPS: ClinicalGroup[] = [
  {
    title: "Hành chính",
    fields: [pick("gioitinh", "Giới tính", opt(["Nam", "Nam"], ["Nu", "Nữ"])), num("namsinh", "Năm sinh")],
  },
  {
    title: "Nghề nghiệp & phơi nhiễm",
    fields: [
      text("cviec", "Công việc hiện tại", "Ghi tự do, ví dụ: công nhân nghiền đá."),
      text("pxuong", "Phân xưởng / bộ phận"),
      num("tuoinghe", "Tuổi nghề", "năm"),
      num("nampx", "Số năm làm ở phân xưởng hiện tại", "năm"),
      pick("cv5nam", "Có làm công việc khác trong 5 năm gần đây", CO_KHONG),
      text("cviec1", "Công việc trước đây 1"),
      num("tgian1", "Thời gian làm công việc 1", "năm"),
      text("cviec2", "Công việc trước đây 2"),
      num("tgian2", "Thời gian làm công việc 2", "năm"),
    ],
  },
  {
    title: "Thể trạng & sinh hiệu",
    fields: [
      num("cao", "Chiều cao", "cm"),
      num("can", "Cân nặng", "kg"),
      num("hatd", "Huyết áp tối đa (tâm thu)", "mmHg"),
      num("hatt", "Huyết áp tối thiểu (tâm trương)", "mmHg"),
      num("mach", "Mạch", "lần/phút"),
      pick("theluc", "Phân loại thể lực", opt(["1", "Loại 1"], ["2", "Loại 2"], ["3", "Loại 3"], ["4", "Loại 4"])),
    ],
  },
  {
    title: "Hút thuốc & tiền sử",
    fields: [
      pick("hutthuoc", "Hút thuốc", opt(["Co hut thuoc", "Có hút thuốc"], ["Khong hut thuoc", "Không hút thuốc"])),
      follow(num("slthuoc", "Số lượng thuốc hút", undefined, "Ghi như trên phiếu khám."), {
        key: "hutthuoc",
        when: "Co hut thuoc",
      }),
      pick("tiensuhh", "Tiền sử bệnh hô hấp", CO_KHONG),
      follow(text("benhhh", "Bệnh hô hấp đã mắc"), yes("tiensuhh")),
      text("tsnoi", "Tiền sử bệnh nội khoa", "Để trống hoặc ghi “không” nếu không có."),
      text("tsngoai", "Tiền sử bệnh ngoại khoa", "Để trống hoặc ghi “không” nếu không có."),
    ],
  },
  {
    title: "Triệu chứng hô hấp",
    fields: [
      pick("ho", "Ho", CO_KHONG),
      follow(pick("tdho", "Thời điểm ho", THOI_DIEM), yes("ho")),
      follow(pick("tsho", "Tần suất ho", opt(["Tung con", "Từng cơn"], ["Lien tuc", "Liên tục"], ["Khac", "Khác"])), yes("ho")),
      follow(text("n1", "Ghi chú khác về ho"), yes("ho")),
      pick("khacdom", "Khạc đờm", CO_KHONG),
      follow(
        pick("loaidom", "Loại đờm", opt(["Dom nhay", "Đờm nhầy"], ["Dom mu", "Đờm mủ"], ["Dom ba dau", "Đờm bã đậu"])),
        yes("khacdom"),
      ),
      follow(pick("tdkhacdo", "Thời điểm khạc đờm", THOI_DIEM), yes("khacdom")),
      pick("khotho", "Khó thở", CO_KHONG),
      follow(
        pick(
          "mdkhotho",
          "Mức độ khó thở",
          // Without the quoted twin level that exists in the raw data (MO_TA_API.md: send the unquoted one).
          opt(
            ["Kho tho khi gang suc", "Khó thở khi gắng sức"],
            ["Kho tho khi lam viec nhe", "Khó thở khi làm việc nhẹ"],
            ["Kho tho thuong xuyen, ca khi nghi ngoi", "Khó thở thường xuyên, cả khi nghỉ ngơi"],
            ["Kho tho tung con", "Khó thở từng cơn"],
          ),
        ),
        yes("khotho"),
      ),
      follow(pick("tdkhotho", "Thời điểm khó thở", THOI_DIEM), yes("khotho")),
      pick("daunguc", "Đau ngực", CO_KHONG),
      follow(
        pick(
          "vitridau",
          "Vị trí đau",
          opt(
            ["Nguc phai", "Ngực phải"],
            ["Nguc trai", "Ngực trái"],
            ["Hai ben nguc", "Hai bên ngực"],
            ["Dau sau xuong uc", "Đau sau xương ức"],
          ),
        ),
        yes("daunguc"),
      ),
      follow(pick("daulan", "Đau lan", CO_KHONG), yes("daunguc")),
      follow(
        pick(
          "tcdau",
          "Tính chất đau",
          opt(["Nhu dao dam", "Như dao đâm"], ["Xiet chat", "Xiết chặt"], ["De ep", "Đè ép"], ["Khac", "Khác"]),
        ),
        yes("daunguc"),
      ),
      follow(text("n2", "Ghi chú khác về tính chất đau"), yes("daunguc")),
      follow(num("tgdau", "Thời gian đau", undefined, "Ghi như trên phiếu khám."), yes("daunguc")),
      follow(
        pick("ytodau", "Yếu tố gây đau", opt(["Khi gang suc", "Khi gắng sức"], ["Khi nghi ngoi", "Khi nghỉ ngơi"], ["Khac", "Khác"])),
        yes("daunguc"),
      ),
      follow(text("n3", "Ghi chú khác về yếu tố gây đau"), yes("daunguc")),
      follow(text("ytotang", "Yếu tố làm đau tăng"), yes("daunguc")),
      pick("chaymui", "Chảy mũi", CO_KHONG),
      pick("khan", "Khàn tiếng", CO_KHONG),
      pick("khokhe", "Khò khè", CO_KHONG),
      text("dhkhac", "Dấu hiệu khác"),
      pick("metmoi", "Mệt mỏi", CO_KHONG),
      pick("sutcan", "Sụt cân", CO_KHONG),
      follow(num("socansut", "Số cân sụt", "kg"), yes("sutcan")),
      follow(num("tgsut", "Thời gian sụt cân", undefined, "Ghi như trên phiếu khám."), yes("sutcan")),
    ],
  },
  {
    title: "Khám thực thể",
    fields: [
      pick("longnguc", "Lồng ngực", opt(["Can doi", "Cân đối"], ["Khong can doi", "Không cân đối"])),
      pick("khoangls", "Khoang liên sườn", opt(["Binh thuong", "Bình thường"], ["Gian rong", "Giãn rộng"])),
      pick("rungthan", "Rung thanh", BT_GIAM),
      pick("go", "Gõ", opt(["Binh thuong", "Bình thường"])),
      pick("riraopn", "Rì rào phế nang", BT_GIAM),
      pick("ran", "Ran", CO_KHONG),
    ],
  },
  {
    title: "Chức năng hô hấp",
    fields: [
      num("fvclt", "FVC lý thuyết (dung tích sống gắng sức dự đoán)", "lít"),
      num("fvctt", "FVC thực tế (đo được)", "lít"),
      num("fev1lt", "FEV1 lý thuyết (thể tích thở ra giây đầu dự đoán)", "lít"),
      num("fev1tt", "FEV1 thực tế (đo được)", "lít"),
      num("fvc", "FVC % so với lý thuyết", "%"),
      num("fev1", "FEV1 % so với lý thuyết", "%"),
      num("gaenler", "Chỉ số Gaensler (FEV1/FVC)", "%"),
    ],
  },
];

export const CLINICAL_FIELDS: ClinicalField[] = CLINICAL_GROUPS.flatMap((group) => group.fields);

export const CLINICAL_FIELD_BY_KEY: Record<string, ClinicalField> = Object.fromEntries(
  CLINICAL_FIELDS.map((field) => [field.key, field]),
);

/** Same limit as the backend and the predict service. */
export const CLINICAL_MAX_TEXT = 500;
