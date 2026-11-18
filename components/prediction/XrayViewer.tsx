"use client";
import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/common/Button";

export function XrayViewer({ src, width, height }: { src: string; width: number; height: number }) {
  const [zoom, setZoom] = useState(1);
  return (
    <div>
      <div
        className="xray-viewer"
        style={{ maxHeight: 510, overflow: zoom > 1 ? "auto" : "hidden" }}
      >
        <div
          className="xray-image-frame"
          style={{ width: `${zoom * 100}%`, maxWidth: zoom > 1 ? "none" : "100%" }}
        >
          <Image
            src={src}
            width={width}
            height={height}
            alt="Ảnh X-quang của lượt chẩn đoán"
            unoptimized
          />
        </div>
      </div>
      <div className="viewer-controls">
        <span className="text-sm text-slate-600">
          {width} × {height} px
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            aria-label="Thu nhỏ ảnh"
            disabled={zoom <= 1}
            onClick={() => setZoom(Math.max(1, zoom - 0.25))}
          >
            <Minus size={16} />
          </Button>
          <span className="text-sm text-slate-600">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            aria-label="Phóng to ảnh"
            disabled={zoom >= 2}
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
          >
            <Plus size={16} />
          </Button>
          <Button variant="ghost" aria-label="Đặt lại kích thước ảnh" onClick={() => setZoom(1)}>
            <RotateCcw size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
