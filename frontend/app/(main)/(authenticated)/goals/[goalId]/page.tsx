import { GoalDetail } from "@/features/GoalDetail";

type Props = {
  params: Promise<{ goalId: string }>;
};

export default async function GoalPage({ params }: Props) {
  const { goalId } = await params;
  return <GoalDetail goalId={Number(goalId)} />;
}
