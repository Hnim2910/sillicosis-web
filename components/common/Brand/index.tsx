import { Activity } from "lucide-react";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-icon">
        <Activity size={24} strokeWidth={2} />
      </span>
      <div>
        <strong>
          Silico<span>Care</span>
        </strong>
        <small>RESPIRATORY HEALTH</small>
      </div>
    </div>
  );
}
