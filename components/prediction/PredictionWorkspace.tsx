"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ImageOff,
  Info,
  ScanLine,
  ZoomIn,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { LocalImage } from "@/services/imageService";
import { authService } from "@/services/authService";
import { predictionService } from "@/services/predictionService";
import { ApiError } from "@/lib/apiClient";
import type { User } from "@/types/user";
import { MODEL_LIMITATIONS, NO_IMAGE_NOTE } from "@/constants/app";
import { TIEU_SU_KEYS, VISIT_GROUPS } from "@/constants/clinicalFields";
import {
  clinicalServerErrors,
  emptyClinicalDraft,
  hasClinicalValue,
  toLamSang,
  validateClinicalDraft,
} from "@/utils/clinicalForm";
import type { ClinicalDraft } from "@/utils/clinicalForm";
import type { ClinicalImportResult } from "@/utils/clinicalImport";
import { birthYear, profileTieuSuDraft, profileWithTieuSu, tieuSuChanges } from "@/utils/tieuSu";
import type { TieuSuChange } from "@/utils/tieuSu";
import { errorMessage, formatDate, today } from "@/utils/format";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { FieldCell, ValueCell } from "@/components/common/FormSection";
import { DatePicker } from "@/components/common/DatePicker";
import { Alert } from "@/components/common/Feedback";
import { Loading } from "@/components/common/Loading";
import { Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { XrayUpload } from "@/components/prediction/XrayUpload";
import { ClinicalFields } from "@/components/prediction/ClinicalFields";
import { ClinicalImport } from "@/components/prediction/ClinicalImport";
import { ClinicalSheetSection } from "@/components/prediction/ClinicalSummary";
import { StepProgress } from "@/components/prediction/StepProgress";

type Errors = Record<string, string>;

const IMAGE_REQUIREMENTS = [
  "Phim X-quang ngực thẳng (tư thế sau – trước hoặc trước – sau), thấy đủ hai phế trường.",
  "Ảnh gốc xuất từ máy hoặc ảnh chụp/scan phim rõ nét, không lóa, không cắt mất vùng phổi.",
  "Không dùng ảnh CT, phim nghiêng, ảnh chụp màn hình có chữ hoặc ảnh không phải phim phổi.",
  "Định dạng PNG hoặc JPEG, dung lượng tối đa 10 MB, cạnh ngắn từ 256 pixel.",
];

function dateError(value: string, birthDate: string): Errors {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today())
    return { examDate: "Ngày khám không hợp lệ hoặc ở tương lai." };
  if (birthDate && value < birthDate) return { examDate: "Ngày khám không được trước ngày sinh." };
  return {};
}

/** Profile values first; the birth year is always the saved birth date's year when there is one. */
function initialDraft(user: User): ClinicalDraft {
  return { ...emptyClinicalDraft(), ...profileTieuSuDraft(user) };
}

function PredictionForm({ user }: { user: User }) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState(today);
  const [draft, setDraft] = useState<ClinicalDraft>(() => initialDraft(user));
  const [image, setImage] = useState<LocalImage | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // Imported values that could not be read (red, cleared field by field as the user edits) and plain notes.
  const [importErrors, setImportErrors] = useState<Errors>({});
  const [importNotes, setImportNotes] = useState<Errors>({});
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [changes, setChanges] = useState<TieuSuChange[] | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [zoom, setZoom] = useState(false);

  const savedYear = birthYear(user);
  const locked: Errors = savedYear ? { namsinh: "Lấy theo ngày sinh trong hồ sơ." } : {};
  const sent: ClinicalDraft = savedYear ? { ...draft, namsinh: savedYear } : draft;

  const localErrors = { ...dateError(examDate, user.birthDate), ...validateClinicalDraft(sent) };
  const errors = { ...importErrors, ...serverErrors, ...localErrors };
  const hasClinical = hasClinicalValue(sent);
  const invalidCount = Object.keys(localErrors).length;

  const confirmBlocked =
    !hasClinical && !image
      ? "Cần có thông tin lâm sàng hoặc ảnh X-quang."
      : invalidCount
        ? `Còn ${invalidCount} ô thông tin cần sửa.`
        : image && !confirmed
          ? "Cần xác nhận ảnh là phim X-quang ngực thẳng."
          : "";

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function changeDraft(next: ClinicalDraft) {
    const unchanged = ([key]: [string, string]) => next[key] === draft[key];
    setImportErrors((current) => Object.fromEntries(Object.entries(current).filter(unchanged)));
    setImportNotes((current) => Object.fromEntries(Object.entries(current).filter(unchanged)));
    setDraft(next);
    setServerErrors({});
  }

  function applyImport(result: ClinicalImportResult) {
    const next = { ...result.draft };
    const notes: Errors = {};
    // Tiểu sử left empty in the file keeps the value from the profile.
    for (const key of ["gioitinh", ...TIEU_SU_KEYS]) if (!next[key]) next[key] = draft[key] ?? "";
    if (savedYear) {
      if (result.draft.namsinh && result.draft.namsinh !== savedYear)
        notes.namsinh = "Năm sinh trong file khác hồ sơ; hệ thống dùng năm theo ngày sinh đã lưu.";
      next.namsinh = savedYear;
    } else if (!next.namsinh) next.namsinh = draft.namsinh ?? "";
    setDraft(next);
    setImportErrors(result.invalid);
    setImportNotes(notes);
    setServerErrors({});
  }

  async function submit() {
    setBusy(true);
    setError("");
    setServerErrors({});
    try {
      const prediction = await predictionService.create({
        examDate,
        lamSang: toLamSang(sent),
        image: image?.file ?? null,
      });
      router.push(`/prediction/${prediction.id}`);
    } catch (reason) {
      const message = errorMessage(reason);
      setError(message);
      toast({ tone: "error", message: `Không thể thực hiện chẩn đoán. ${message}` });
      if (reason instanceof ApiError) {
        const fields = reason.fieldErrors as Errors;
        const clinical = clinicalServerErrors(fields);
        setServerErrors({ ...clinical, ...(fields.examDate ? { examDate: fields.examDate } : {}) });
        if (Object.keys(clinical).length || fields.examDate) setStep(0);
      }
      setBusy(false);
    }
  }

  function confirmAndSubmit() {
    if (confirmBlocked || busy) return;
    const found = tieuSuChanges(user, sent);
    if (found.length) setChanges(found);
    else void submit();
  }

  async function updateProfileThenSubmit() {
    setUpdatingProfile(true);
    try {
      await authService.updateProfile(profileWithTieuSu(user, sent));
      toast({ tone: "success", message: "Đã cập nhật tiểu sử trong hồ sơ cá nhân." });
      setChanges(null);
      void submit();
    } catch (reason) {
      toast({
        tone: "error",
        message: `Không thể cập nhật hồ sơ cá nhân. ${errorMessage(reason)}`,
      });
    } finally {
      setUpdatingProfile(false);
    }
  }

  const steps = [
    { title: "Thông tin lâm sàng", enabled: !busy, done: hasClinical && !invalidCount },
    { title: "Ảnh X-quang", enabled: !busy, done: !!image && confirmed },
    {
      title: "Xác nhận và chẩn đoán",
      enabled: !busy && !confirmBlocked,
      done: false,
      blockedReason: confirmBlocked,
    },
  ];

  const edit = () => setStep(0);

  return (
    <div className="stack wizard">
      <StepProgress steps={steps} current={step} onSelect={setStep} />
      {error && step === 2 && <Alert>{error}</Alert>}

      {step === 0 && (
        <>
          <Card>
            <div className="wizard-toolbar">
              <div className="stack !gap-2">
                <ClinicalImport onImport={applyImport} disabled={busy} />
                <p className="wizard-toolbar__note">
                  Hệ thống chỉ hỗ trợ định dạng .xlsx theo file mẫu, các mục tiểu sử để trống sẽ tự
                  động giữ nguyên theo mục tiểu sử trong hồ sơ cá nhân
                </p>
              </div>
              <div className="wizard-date field-grid">
                <FieldCell label="Ngày khám" htmlFor="exam-date" span={12} error={errors.examDate}>
                  <DatePicker
                    id="exam-date"
                    min={user.birthDate || "1900-01-01"}
                    max={today()}
                    value={examDate}
                    invalid={!!errors.examDate}
                    describedBy="exam-date-message"
                    onChange={(next) => {
                      setExamDate(next);
                      setServerErrors({});
                    }}
                  />
                </FieldCell>
              </div>
            </div>
          </Card>
          <ClinicalFields
            value={sent}
            onChange={changeDraft}
            errors={errors}
            notes={importNotes}
            locked={locked}
            disabled={busy}
          />
          <div className="wizard-footer">
            <span />
            <Button onClick={() => setStep(1)}>
              Tiếp tục
              <ArrowRight size={16} />
            </Button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div className="xray-step">
            <Card className="xray-step__card">
              <CardHeader
                title="Ảnh X-quang ngực"
                description="Không bắt buộc, nhưng giúp kết quả chính xác hơn."
              />
              <div className="card-body xray-step__body">
                <XrayUpload
                  value={image}
                  onChange={(next) => {
                    setImage(next);
                    setConfirmed(false);
                  }}
                  disabled={busy}
                />
              </div>
            </Card>
            <Card className="xray-step__card">
              <CardHeader title="Yêu cầu ảnh" />
              <div className="card-body xray-step__body">
                <ul className="requirement-list">
                  {IMAGE_REQUIREMENTS.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="xray-step__notes">
                  <Alert tone="info">
                    Hệ thống chưa tự nhận biết loại ảnh. Ảnh không phải phim X-quang ngực thẳng vẫn
                    được mô hình chấm điểm và cho kết quả sai, vì vậy hãy kiểm tra kỹ trước khi gửi.
                  </Alert>
                  {image ? (
                    <label className="prediction-checkbox">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        disabled={busy}
                        onChange={(event) => setConfirmed(event.target.checked)}
                      />
                      <span>
                        Tôi xác nhận đây là phim X-quang ngực thẳng của chính tôi, chụp gần với ngày
                        khám.
                        {!confirmed && (
                          <small className="block field-error">Cần xác nhận để tiếp tục.</small>
                        )}
                      </span>
                    </label>
                  ) : (
                    hasClinical && <p className="notice">{NO_IMAGE_NOTE}</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
          <div className="wizard-footer">
            <Button variant="secondary" onClick={() => setStep(0)}>
              <ArrowLeft size={16} />
              Quay lại
            </Button>
            <div className="wizard-footer__end">
              {confirmBlocked && <small className="wizard-footer__hint">{confirmBlocked}</small>}
              <Button disabled={!!confirmBlocked} onClick={() => setStep(2)}>
                Tiếp tục
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Card className="exam-sheet">
            <div className="exam-sheet__header">
              <h2>Phiếu thông tin chẩn đoán</h2>
              <span className="exam-sheet__date">
                <CalendarDays size={16} />
                Ngày khám <strong>{formatDate(examDate)}</strong>
              </span>
            </div>
            <div className="exam-sheet__top">
              <div className="exam-sheet__image">
                <div className="exam-sheet__image-head">
                  <span>Phim X-quang ngực</span>
                  <button type="button" className="text-link" onClick={() => setStep(1)}>
                    {image ? "Đổi ảnh" : "Thêm ảnh"}
                  </button>
                </div>
                {image ? (
                  <button type="button" className="confirm-image" onClick={() => setZoom(true)}>
                    <Image
                      src={image.url}
                      alt="Ảnh X-quang sẽ gửi"
                      width={image.width}
                      height={image.height}
                      unoptimized
                    />
                    <span className="confirm-image__zoom">
                      <ZoomIn size={16} />
                      Phóng to
                    </span>
                  </button>
                ) : (
                  <div className="confirm-no-image">
                    <ImageOff size={28} />
                    <p>{NO_IMAGE_NOTE}</p>
                  </div>
                )}
              </div>
              <div className="exam-sheet__side">
                <ClinicalSheetSection
                  title="Hành chính"
                  heading="Thông tin hành chính"
                  draft={sent}
                  onEdit={edit}
                  span={4}
                  before={<ValueCell label="Tên bệnh nhân" value={user.name || "-"} span={4} />}
                />
                <ClinicalSheetSection
                  title="Hút thuốc & tiền sử"
                  heading="Tiền sử"
                  draft={sent}
                  onEdit={edit}
                  span={4}
                />
              </div>
            </div>
            {["Nghề nghiệp & phơi nhiễm", ...VISIT_GROUPS].map((title) => (
              <ClinicalSheetSection key={title} title={title} draft={sent} onEdit={edit} />
            ))}
          </Card>
          <Alert tone="info">
            <ul className="list-disc pl-5">
              {MODEL_LIMITATIONS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Alert>
          <div className="wizard-footer">
            <Button variant="secondary" disabled={busy} onClick={() => setStep(1)}>
              <ArrowLeft size={16} />
              Quay lại
            </Button>
            <div className="wizard-footer__end">
              {busy && (
                <small role="status" className="wizard-footer__hint">
                  Đang phân tích, có thể mất tới 30 giây…
                </small>
              )}
              <Button busy={busy} disabled={!!confirmBlocked} onClick={confirmAndSubmit}>
                <ScanLine size={18} />
                {busy ? "Đang phân tích…" : "Chẩn đoán"}
              </Button>
            </div>
          </div>
        </>
      )}

      <Modal
        open={!!changes}
        onClose={() => !updatingProfile && setChanges(null)}
        title="Tiểu sử khác với hồ sơ đã lưu"
        description="Các trường dưới đây trong lần chẩn đoán này khác với hồ sơ của bạn. Bạn có muốn cập nhật hồ sơ không?"
        wide
        footer={
          <>
            <Button
              variant="secondary"
              disabled={updatingProfile}
              onClick={() => {
                setChanges(null);
                void submit();
              }}
            >
              Chỉ dùng cho lần này
            </Button>
            <Button busy={updatingProfile} onClick={updateProfileThenSubmit}>
              Cập nhật hồ sơ và chẩn đoán
            </Button>
          </>
        }
      >
        <div className="table-scroll">
          <table className="changes-table">
            <thead>
              <tr>
                <th>Trường</th>
                <th>Hồ sơ đang lưu</th>
                <th>Lần chẩn đoán này</th>
              </tr>
            </thead>
            <tbody>
              {(changes ?? []).map((change) => (
                <tr key={change.key}>
                  <td>{change.label}</td>
                  <td className={change.saved === "-" ? "summary-empty" : undefined}>
                    {change.saved}
                  </td>
                  <td className="font-semibold">{change.current}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="notice mt-3 flex items-start gap-2">
          <Info size={16} className="mt-0.5 shrink-0" />
          Dù chọn cách nào, lượt chẩn đoán này vẫn dùng các giá trị mới.
        </p>
      </Modal>

      <Modal open={zoom && !!image} onClose={() => setZoom(false)} title="Ảnh X-quang sẽ gửi" wide>
        {image && (
          <div className="image-preview">
            <Image
              src={image.url}
              alt="Ảnh X-quang sẽ gửi, phóng to"
              width={image.width}
              height={image.height}
              unoptimized
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export function PredictionWorkspace() {
  const { user } = useAuth();
  return (
    <div className="prediction-app">
      <PageHeader
        title="Chẩn đoán mới"
        description="Cung cấp thông tin lâm sàng và tải lên phim X-quang (nếu có) để hệ thống đưa ra phân tích và chẩn đoán"
      />
      {user ? <PredictionForm user={user} /> : <Loading />}
    </div>
  );
}
