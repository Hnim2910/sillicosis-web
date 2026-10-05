import type { XrayImage } from "@/types/prediction";
import { MAX_IMAGE_BYTES } from "@/constants/app";

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
  async prepare(file: File): Promise<XrayImage> {
    if (!["image/jpeg", "image/png"].includes(file.type) || !/\.(png|jpe?g)$/i.test(file.name))
      throw new Error("Chỉ chấp nhận ảnh PNG hoặc JPEG.");
    if (!file.size || file.size > MAX_IMAGE_BYTES)
      throw new Error("Ảnh phải có dung lượng từ 1 byte đến 10 MB.");
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      if (Math.min(image.naturalWidth, image.naturalHeight) < 256)
        throw new Error("Ảnh quá nhỏ. Kích thước tối thiểu của bản demo là 256 × 256 pixel.");
      if (image.naturalWidth * image.naturalHeight > 40_000_000)
        throw new Error("Ảnh quá lớn. Vui lòng chọn ảnh dưới 40 megapixel.");
      // A compact preview keeps the mock store within browser storage limits.
      const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Trình duyệt không hỗ trợ xem trước ảnh.");
      context.fillStyle = "#111b22";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return {
        name: file.name,
        url: canvas.toDataURL("image/jpeg", 0.8),
        size: file.size,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  },
  async sample(): Promise<XrayImage> {
    return {
      name: "xray-demo.svg",
      url: "/images/xray-demo.svg",
      size: 2048,
      width: 600,
      height: 640,
    };
  },
};
