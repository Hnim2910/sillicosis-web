import { Card, CardHeader } from "@/components/common/Card";
import { EmptyState } from "@/components/common/Feedback";

export function ResultDistribution({ normal, silicosis }: { normal: number; silicosis: number }) {
  const total = normal + silicosis;
  return (
    <Card>
      <CardHeader
        title="Phân bố kết quả"
        description="Các lượt chẩn đoán thành công"
      />
      {!total ? (
        <EmptyState description="Biểu đồ xuất hiện sau lần dự đoán đầu tiên." />
      ) : (
        <div className="distribution">
          <div
            className="donut"
            role="img"
            aria-label={`${normal} không phát hiện, ${silicosis} nghi bụi phổi silic, tổng ${total}`}
            style={{
              background: `conic-gradient(#3a9d89 0 ${(normal / total) * 100}%, #ebbc74 ${(normal / total) * 100}% 100%)`,
            }}
          >
            <div className="donut-center">
              <strong>{total}</strong>
              <span>LƯỢT DỰ ĐOÁN</span>
            </div>
          </div>
          <div className="legend">
            <div className="legend-item">
              <span className="legend-dot bg-teal-600" />
              Không phát hiện<strong>{normal}</strong>
            </div>
            <div className="legend-item">
              <span className="legend-dot bg-amber-300" />
              Nghi bụi phổi silic<strong>{silicosis}</strong>
            </div>
            <p className="notice">Kết quả thử nghiệm của mô hình AI</p>
          </div>
        </div>
      )}
    </Card>
  );
}
