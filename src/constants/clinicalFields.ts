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
  /** Accepted range of a number field (inclusive); a value outside it is rejected by the form. */
  min?: number;
  max?: number;
  /** Example value shown as the input's placeholder. */
  placeholder?: string;
  /** Width on the form's 12-column grid (default 4 = three fields per row, 6 for free text). */
  span?: 3 | 4 | 6 | 8 | 12;
}

export interface ClinicalGroup {
  title: string;
  /** One line under the group title (e.g. what "lý thuyết" means). */
  description?: string;
  /** A main question whose follow-ups are shown starts its own row, with the follow-ups beside it. */
  rowPerQuestion?: boolean;
  fields: ClinicalField[];
}

const opt = (...pairs: [string, string][]): ClinicalOption[] =>
  pairs.map(([code, label]) => ({ code, label }));

const CO_KHONG = opt(["Co", "Có"], ["Khong", "Không"]);
const THOI_DIEM = opt(
  ["Ban ngay", "Ban ngày"],
  ["Ban dem", "Ban đêm"],
  ["Ca ngay va dem", "Cả ngày và đêm"],
);
const BT_GIAM = opt(["Binh thuong", "Bình thường"], ["Giam", "Giảm"]);

const yes = (key: string) => ({ key, when: "Co" });
const num = (key: string, label: string, unit?: string, hint?: string): ClinicalField => ({
  key,
  label,
  kind: "so",
  unit,
  hint,
});
const text = (key: string, label: string, hint?: string): ClinicalField => ({
  key,
  label,
  kind: "chu",
  hint,
});
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
    fields: [
      pick("gioitinh", "Giới tính", opt(["Nam", "Nam"], ["Nu", "Nữ"])),
      num("namsinh", "Năm sinh"),
    ],
  },
  {
    title: "Nghề nghiệp & phơi nhiễm",
    fields: [
      text("cviec", "Công việc hiện tại"),
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
      pick(
        "theluc",
        "Phân loại thể lực",
        opt(["1", "Loại 1"], ["2", "Loại 2"], ["3", "Loại 3"], ["4", "Loại 4"]),
      ),
    ],
  },
  {
    title: "Hút thuốc & tiền sử",
    fields: [
      pick(
        "hutthuoc",
        "Hút thuốc",
        opt(["Co hut thuoc", "Có hút thuốc"], ["Khong hut thuoc", "Không hút thuốc"]),
      ),
      follow(num("slthuoc", "Số lượng thuốc hút"), {
        key: "hutthuoc",
        when: "Co hut thuoc",
      }),
      pick("tiensuhh", "Tiền sử bệnh hô hấp", CO_KHONG),
      follow(text("benhhh", "Bệnh hô hấp đã mắc"), yes("tiensuhh")),
      text("tsnoi", "Tiền sử bệnh nội khoa"),
      text("tsngoai", "Tiền sử bệnh ngoại khoa"),
    ],
  },
  {
    title: "Triệu chứng hô hấp",
    rowPerQuestion: true,
    fields: [
      pick("ho", "Ho", CO_KHONG),
      follow(pick("tdho", "Thời điểm ho", THOI_DIEM), yes("ho")),
      follow(
        pick(
          "tsho",
          "Tần suất ho",
          opt(["Tung con", "Từng cơn"], ["Lien tuc", "Liên tục"], ["Khac", "Khác"]),
        ),
        yes("ho"),
      ),
      follow(text("n1", "Ghi chú khác về ho"), yes("ho")),
      pick("khacdom", "Khạc đờm", CO_KHONG),
      follow(
        pick(
          "loaidom",
          "Loại đờm",
          opt(["Dom nhay", "Đờm nhầy"], ["Dom mu", "Đờm mủ"], ["Dom ba dau", "Đờm bã đậu"]),
        ),
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
          opt(
            ["Nhu dao dam", "Như dao đâm"],
            ["Xiet chat", "Xiết chặt"],
            ["De ep", "Đè ép"],
            ["Khac", "Khác"],
          ),
        ),
        yes("daunguc"),
      ),
      follow(text("n2", "Ghi chú khác về tính chất đau"), yes("daunguc")),
      follow(num("tgdau", "Thời gian đau"), yes("daunguc")),
      follow(
        pick(
          "ytodau",
          "Yếu tố gây đau",
          opt(
            ["Khi gang suc", "Khi gắng sức"],
            ["Khi nghi ngoi", "Khi nghỉ ngơi"],
            ["Khac", "Khác"],
          ),
        ),
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
      follow(num("tgsut", "Thời gian sụt cân"), yes("sutcan")),
    ],
  },
  {
    title: "Khám thực thể",
    fields: [
      pick(
        "longnguc",
        "Lồng ngực",
        opt(["Can doi", "Cân đối"], ["Khong can doi", "Không cân đối"]),
      ),
      pick(
        "khoangls",
        "Khoang liên sườn",
        opt(["Binh thuong", "Bình thường"], ["Gian rong", "Giãn rộng"]),
      ),
      pick("rungthan", "Rung thanh", BT_GIAM),
      pick("go", "Gõ", opt(["Binh thuong", "Bình thường"])),
      pick("riraopn", "Rì rào phế nang", BT_GIAM),
      pick("ran", "Ran", CO_KHONG),
    ],
  },
  {
    title: "Chức năng hô hấp",
    description:
      "FVC: dung tích sống gắng sức; FEV1: thể tích thở ra trong giây đầu. Giá trị lý thuyết là mức chuẩn theo tuổi, giới, chiều cao.",
    fields: [
      num("fvclt", "FVC lý thuyết", "lít"),
      num("fvctt", "FVC thực tế (đo được)", "lít"),
      num("fvc", "FVC % so với lý thuyết", "%"),
      num("fev1lt", "FEV1 lý thuyết", "lít"),
      num("fev1tt", "FEV1 thực tế (đo được)", "lít"),
      num("fev1", "FEV1 % so với lý thuyết", "%"),
      num("gaenler", "Chỉ số Gaensler (FEV1/FVC)", "%"),
    ],
  },
];

/** Plausible ranges for the number fields (proposed by the web team, to be confirmed by the ML team). Values outside
 *  them are almost certainly typing mistakes; the model itself accepts any number. */
const RANGES: Record<string, [number, number]> = {
  namsinh: [1900, new Date().getFullYear()],
  tuoinghe: [0, 70],
  nampx: [0, 70],
  tgian1: [0, 70],
  tgian2: [0, 70],
  cao: [100, 220],
  can: [25, 200],
  hatd: [60, 260],
  hatt: [30, 160],
  mach: [30, 200],
  slthuoc: [0, 1000],
  tgdau: [0, 1000],
  socansut: [0, 100],
  tgsut: [0, 1000],
  fvclt: [0.1, 10],
  fvctt: [0.1, 10],
  fev1lt: [0.1, 10],
  fev1tt: [0.1, 10],
  fvc: [10, 200],
  fev1: [10, 200],
  gaenler: [10, 150],
};
/** Example values (fake) shown as placeholders. */
const EXAMPLES: Record<string, string> = {
  namsinh: "1980",
  cviec: "Công nhân nghiền đá",
  pxuong: "Phân xưởng nghiền sàng",
  tuoinghe: "12",
  nampx: "5",
  cviec1: "Thợ khoan đá",
  tgian1: "3",
  cviec2: "Công nhân xây dựng",
  tgian2: "2",
  slthuoc: "10",
  benhhh: "Viêm phế quản mạn",
  tsnoi: "Tăng huyết áp; để trống nếu không có",
  tsngoai: "Mổ ruột thừa năm 2015; để trống nếu không có",
  cao: "165",
  can: "60",
  hatd: "120",
  hatt: "80",
  mach: "76",
  n1: "Ho nhiều khi tiếp xúc bụi",
  n2: "Đau âm ỉ",
  tgdau: "2",
  n3: "Khi thay đổi thời tiết",
  ytotang: "Khi ho hoặc hít sâu",
  dhkhac: "Đau họng, sốt nhẹ",
  socansut: "3",
  tgsut: "2",
  fvclt: "4,2",
  fvctt: "3,8",
  fev1lt: "3,5",
  fev1tt: "3,1",
  fvc: "90",
  fev1: "88",
  gaenler: "82",
};

/** Grid widths that differ from the default (4, or 6 for free text). Chosen per group so rows line up. */
const SPANS: Record<string, ClinicalField["span"]> = {
  cviec1: 8,
  cviec2: 8,
  benhhh: 12,
  n1: 12,
  n2: 8,
  n3: 4,
  ytotang: 4,
  dhkhac: 12,
};

for (const group of CLINICAL_GROUPS)
  for (const field of group.fields) {
    if (RANGES[field.key]) [field.min, field.max] = RANGES[field.key];
    field.placeholder = EXAMPLES[field.key] ? `VD: ${EXAMPLES[field.key]}` : undefined;
    field.span = SPANS[field.key] ?? (field.kind === "chu" ? 6 : 4);
  }

export const CLINICAL_FIELDS: ClinicalField[] = CLINICAL_GROUPS.flatMap((group) => group.fields);

export const CLINICAL_FIELD_BY_KEY: Record<string, ClinicalField> = Object.fromEntries(
  CLINICAL_FIELDS.map((field) => [field.key, field]),
);

/** Same limit as the backend and the predict service. */
export const CLINICAL_MAX_TEXT = 500;

export const CLINICAL_GROUP_BY_TITLE: Record<string, ClinicalGroup> = Object.fromEntries(
  CLINICAL_GROUPS.map((group) => [group.title, group]),
);

/** "Tiểu sử": what stays the same from one visit to the next. Saved in the profile (users.tieu_su, except gender and
 *  birth year which come from users.gender / users.birth_date) and pre-filled in every new screening. */
export const TIEU_SU_GROUPS = ["Hành chính", "Nghề nghiệp & phơi nhiễm", "Hút thuốc & tiền sử"];

/** Keys stored in the profile's tieuSu (same list as TieuSu.java in the backend). */
export const TIEU_SU_KEYS = TIEU_SU_GROUPS.filter((title) => title !== "Hành chính").flatMap(
  (title) => CLINICAL_GROUP_BY_TITLE[title].fields.map((field) => field.key),
);

/** The other groups: measured again at every visit. */
export const VISIT_GROUPS = CLINICAL_GROUPS.map((group) => group.title).filter(
  (title) => !TIEU_SU_GROUPS.includes(title),
);
