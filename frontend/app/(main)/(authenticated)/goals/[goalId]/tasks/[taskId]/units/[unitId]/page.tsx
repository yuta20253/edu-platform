import { Unit } from "@/features/Unit";

type Props = {
  params: Promise<{ goalId: string; taskId: string; unitId: string }>;
};

export default async function UnitPage({ params }: Props) {
  const { goalId, taskId, unitId } = await params;

  return (
    <Unit
      goalId={Number(goalId)}
      taskId={Number(taskId)}
      unitId={Number(unitId)}
    />
  );
}
