import { Unit } from "@/features/student/Unit";

type Props = {
  params: Promise<{ taskId: string; unitId: string }>;
};

export default async function UnitPage({ params }: Props) {
  const { taskId, unitId } = await params;
  return <Unit taskId={Number(taskId)} unitId={Number(unitId)} />;
}
