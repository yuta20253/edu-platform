import { EditGoal } from "@/features/EditGoal";

type Props = {
  params: Promise<{ goalId: string }>;
};

export default async function EditGoalPage({ params }: Props) {
  const { goalId } = await params;
  return <EditGoal goalId={Number(goalId)} />;
}
