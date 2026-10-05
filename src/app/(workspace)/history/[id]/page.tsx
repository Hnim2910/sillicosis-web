import { PredictionResult } from "@/components/prediction/PredictionResult";
export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PredictionResult id={id} />;
}
