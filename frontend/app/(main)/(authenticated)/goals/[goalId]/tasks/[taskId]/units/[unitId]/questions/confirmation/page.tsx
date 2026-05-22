import { QuestionConfirmation } from "@/features/QuestionConfirmation";

type Props = {
  params: Promise<{ goalId: string; taskId: string; unitId: string }>;
};

export default async function QuestionConfirmationPage({ params }: Props) {
  const { goalId, taskId, unitId } = await params;

  return (
    <QuestionConfirmation
      goalId={Number(goalId)}
      taskId={Number(taskId)}
      unitId={Number(unitId)}
    />
  );
}
