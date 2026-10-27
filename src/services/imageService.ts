import { MAX_IMAGE_BYTES } from "@/constants/app";
import { ApiError, apiBlob, apiRequest } from "@/lib/apiClient";

/** An image chosen on this device, before upload. `url` is an object URL the caller must revoke. */
export interface LocalImage {
  file: File;
  name: string;
  url: string;
  size: number;
  width: number;
  height: number;
}

export function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Không thể đọc ảnh. Vui lòng chọn tệp PNG hoặc JPEG khác."));
    image.src = source;
  });
}

export const imageService = {
  /** Same checks as the backend (type, 10 MB, short side ≥ 256 px) so most mistakes show before upload. */
  async prepare(file: File): Promise<LocalImage> {
    if (!["image/jpeg", "image/png"].includes(file.type) || !/\.(png|jpe?g)$/i.test(file.name))
      throw new Error("Chỉ chấp nhận ảnh PNG hoặc JPEG.");
    if (!file.size || file.size > MAX_IMAGE_BYTES)
      throw new Error("Ảnh phải có dung lượng từ 1 byte đến 10 MB.");
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      if (Math.min(image.naturalWidth, image.naturalHeight) < 256)
        throw new Error("Ảnh quá nhỏ. Cạnh ngắn phải từ 256 pixel.");
      if (Math.max(image.naturalWidth, image.naturalHeight) > 8000)
        throw new Error("Ảnh quá lớn. Cạnh dài tối đa 8000 pixel.");
      return {
        file,
        name: file.name,
        url,
        size: file.size,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
    } catch (reason) {
      URL.revokeObjectURL(url);
      throw reason;
    }
  },
  /** Uploads and returns the image id. Re-uploading the same picture reuses the stored one. */
  async upload(file: File) {
    const form = new FormData();
    form.append("file", file);
    try {
      return (await apiRequest<{ id: string }>("/api/images", { method: "POST", body: form })).id;
    } catch (reason) {
      const existing = reason instanceof ApiError && reason.details.imageId;
      if (
        reason instanceof ApiError &&
        reason.code === "IMAGE_DUPLICATE" &&
        typeof existing === "string"
      )
        return existing;
      throw reason;
    }
  },
  /** Object URL for a stored image (the content endpoint needs the Bearer token). Revoke it when done. */
  async contentUrl(imageId: string) {
    return URL.createObjectURL(await apiBlob(`/api/images/${encodeURIComponent(imageId)}/content`));
  },
};
