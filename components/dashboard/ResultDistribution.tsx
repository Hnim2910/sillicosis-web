"use client";
import { useState } from "react";
import type { PredictionOutcome } from "@/types/prediction";
import { OUTCOME_LABELS } from "@/constants/app";
import { Card, CardHeader } from "@/components/common/Card";
import { EmptyState } from "@/components/common/Feedback";

/** Ring colours with ≥ 4.5:1 contrast on white. */
const COLORS: Record<PredictionOutcome, string> = {
  Co: "#a8630b",
  Khong: "#16806f",
  FAILED: "#b04a4a",
};
const ORDER: PredictionOutcome[] = ["Co", "Khong", "FAILED"];
const SIZE = 196;
const STROKE = 26;
/** Hovered segments grow by HOVER_GROWTH; the margin keeps them inside the SVG so nothing is clipped. */
const HOVER_GROWTH = 8;
const RADIUS = (SIZE - STROKE - HOVER_GROWTH - 4) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Donut by result label; hovering (or focusing) a segment shows its count and share. */
export function ResultDistribution({ counts }: { counts: Record<PredictionOutcome, number> }) {
  const [active, setActive] = useState<PredictionOutcome | null>(null);
  // Cursor position inside the chart; null when the segment was focused with the keyboard.
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const follow = (event: React.MouseEvent<SVGCircleElement>) => {
    const box = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
    setPointer({ x: event.clientX - box.left, y: event.clientY - box.top });
  };
  const total = ORDER.reduce((sum, key) => sum + counts[key], 0);
  const share = (key: PredictionOutcome) => (total ? counts[key] / total : 0);
  const percent = (key: PredictionOutcome) => `${Math.round(share(key) * 100)}%`;
  const segments = ORDER.map((key, index) => ({
    key,
    offset: ORDER.slice(0, index).reduce((sum, previous) => sum + share(previous), 0),
  })).filter(({ key }) => counts[key] > 0);

  return (
    <Card className="h-full">
      <CardHeader title="Phân bố kết quả" description="Theo nhãn kết quả của mọi lượt chẩn đoán" />
      {!total ? (
        <EmptyState description="Biểu đồ xuất hiện sau lần chẩn đoán đầu tiên." />
      ) : (
        <div className="distribution">
          <div className="donut-chart">
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              role="img"
              aria-label={
                ORDER.map(
                  (key) => `${OUTCOME_LABELS[key]}: ${counts[key]} lượt (${percent(key)})`,
                ).join(", ") + `. Tổng ${total} lượt.`
              }
            >
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="#eef2f4"
                strokeWidth={STROKE}
              />
              {segments.map(({ key, offset }) => (
                <circle
                  key={key}
                  className="donut-segment"
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={COLORS[key]}
                  strokeWidth={active === key ? STROKE + HOVER_GROWTH : STROKE}
                  strokeDasharray={`${share(key) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-offset * CIRCUMFERENCE}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  tabIndex={0}
                  aria-label={`${OUTCOME_LABELS[key]}: ${counts[key]} lượt, ${percent(key)}`}
                  onMouseEnter={(event) => {
                    setActive(key);
                    follow(event);
                  }}
                  onMouseMove={follow}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => {
                    setActive(key);
                    setPointer(null);
                  }}
                  onBlur={() => setActive(null)}
                />
              ))}
            </svg>
            <div className="donut-label" aria-hidden="true">
              <strong>{total}</strong>
              <span>Lượt chẩn đoán</span>
            </div>
            {active && (
              <div
                className={pointer ? "donut-tooltip is-following" : "donut-tooltip"}
                role="status"
                style={pointer ? { left: pointer.x, top: pointer.y } : undefined}
              >
                <span className="legend-dot" style={{ background: COLORS[active] }} />
                <div>
                  <strong>{OUTCOME_LABELS[active]}</strong>
                  <p>
                    {counts[active]} lượt · {percent(active)} tổng số
                  </p>
                </div>
              </div>
            )}
          </div>
          <ul className="legend">
            {ORDER.map((key) => (
              <li
                key={key}
                className={`legend-item${active === key ? " is-active" : ""}`}
                onMouseEnter={() => {
                  setActive(key);
                  setPointer(null);
                }}
                onMouseLeave={() => setActive(null)}
              >
                <span className="legend-dot" style={{ background: COLORS[key] }} />
                <span>{OUTCOME_LABELS[key]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
