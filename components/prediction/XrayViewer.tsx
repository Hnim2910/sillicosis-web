"use client";
import { useState } from "react";
import Image from "next/image";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { XrayImage } from "@/types/prediction";
import { Button } from "@/components/common/Button";

export function XrayViewer({ image }: { image: XrayImage }) {
  const [heatmap, setHeatmap] = useState(false);
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
            src={image.url}
            width={image.width}
            height={image.height}
            alt="Ảnh X-quang của bản ghi"
            unoptimized
          />
          {heatmap && (
            <div
              className="heatmap"
              aria-label="Lớp bản đồ nhiệt minh họa, không phải kết quả AI"
            />
          )}
        </div>
      </div>
      <div className="viewer-controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={heatmap}
            onChange={(event) => setHeatmap(event.target.checked)}
          />
          Xem giải thích XAI
        </label>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            aria-label="Thu nhỏ ảnh"
            disabled={zoom <= 1}
            onClick={() => setZoom(Math.max(1, zoom - 0.25))}
          >
            <Minus size={16} />
          </Button>
          <span className="text-xs text-slate-400">{Math.round(zoom * 100)}%</span>
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
      {heatmap && (
        <>
          <div className="heatmap-legend">
            Ảnh hưởng thấp
            <span />
            Cao
          </div>
          <p className="notice mt-2">
            Heatmap minh họa cố định để demo giao diện, không thể hiện phân tích hay vị trí bệnh
            trên ảnh.
          </p>
        </>
      )}
    </div>
  );
}
