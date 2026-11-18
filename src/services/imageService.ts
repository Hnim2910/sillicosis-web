import { MAX_IMAGE_BYTES } from "@/constants/app";

/** An image chosen on this device, before it is sent. `url` is an object URL the caller must revoke. */
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
  /** Same checks as the backend (type, 10 MB, short side ≥ 256 px) so most mistakes show before sending. */
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
};
