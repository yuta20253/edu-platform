import { Question } from "@/features/Question";

type Props = {
  params: Promise<{ goalId: string; taskId: string; unitId: string }>;
};

export default async function QuestionPage({ params }: Props) {
  const { goalId, taskId, unitId } = await params;

  return (
    <Question
      goalId={Number(goalId)}
      taskId={Number(taskId)}
      unitId={Number(unitId)}
    />
  );
}
