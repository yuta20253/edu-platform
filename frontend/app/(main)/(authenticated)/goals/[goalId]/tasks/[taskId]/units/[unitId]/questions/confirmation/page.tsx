import { QuestionConfirmation } from "@/features/QuestionConfirmation";

type Props = {
  params: Promise<{ goalId: string; taskId: string; unitId: string }>;
  searchParams: Promise<{ answered_question_ids?: string }>;
};

export default async function QuestionConfirmationPage({
  params,
  searchParams,
}: Props) {
  const { goalId, taskId, unitId } = await params;

  const { answered_question_ids } = await searchParams;

  const answeredQuestionIds = answered_question_ids
    ? answered_question_ids.split(",").map(Number)
    : [];

  return (
    <QuestionConfirmation
      goalId={Number(goalId)}
      taskId={Number(taskId)}
      unitId={Number(unitId)}
      answeredQuestionIds={answeredQuestionIds}
    />
  );
}
