"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { FileImage, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { imageService } from "@/services/imageService";
import type { LocalImage } from "@/services/imageService";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { cn, errorMessage } from "@/utils/format";

export function XrayUpload({
  value,
  onChange,
  disabled = false,
}: {
  value: LocalImage | null;
  onChange: (image: LocalImage | null) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function select(file?: File) {
    if (!file || disabled || busy) return;
    setBusy(true);
    setError("");
    onChange(null);
    try {
      onChange(await imageService.prepare(file));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      {error && <Alert>{error}</Alert>}
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg"
        aria-label="Chọn ảnh X-quang"
        disabled={disabled || busy}
        onChange={(event) => {
          void select(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {value ? (
        <div>
          <div className="image-preview">
            <Image
              src={value.url}
              alt="Ảnh đã chọn để chẩn đoán"
              width={value.width}
              height={value.height}
              unoptimized
            />
          </div>
          <div className="upload-meta">
            <FileImage size={18} className="text-teal-700" />
            <span className="flex-1">
              {value.name}
              <small className="block text-slate-600">
                {value.width} × {value.height} px · {(value.size / 1024).toFixed(1)} KB
              </small>
            </span>
            <Button
              variant="ghost"
              aria-label="Xóa ảnh đã chọn"
              disabled={disabled || busy}
              onClick={() => onChange(null)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn("dropzone", dragging && "dragging")}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void select(event.dataTransfer.files[0]);
          }}
        >
          <span className="upload-icon">
            <UploadCloud size={30} strokeWidth={1.4} />
          </span>
          <h3>Kéo thả ảnh X-quang vào đây</h3>
          <p>PNG hoặc JPEG · Tối đa 10 MB · Cạnh ngắn từ 256 px</p>
          <Button
            variant="secondary"
            busy={busy}
            disabled={disabled}
            onClick={() => input.current?.click()}
          >
            <ImagePlus size={16} />
            Chọn ảnh từ thiết bị
          </Button>
        </div>
      )}
      {value && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            disabled={disabled || busy}
            onClick={() => input.current?.click()}
          >
            Chọn ảnh khác
          </Button>
        </div>
      )}
    </div>
  );
}
