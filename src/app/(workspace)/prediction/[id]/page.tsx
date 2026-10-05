import { PredictionResult } from "@/components/prediction/PredictionResult";
export default async function PredictionResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PredictionResult id={id} />;
}
