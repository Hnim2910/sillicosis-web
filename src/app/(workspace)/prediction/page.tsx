import { PredictionWorkspace } from "@/components/prediction/PredictionWorkspace";
export default async function PredictionPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const { patient } = await searchParams;
  return <PredictionWorkspace patientId={patient} />;
}
