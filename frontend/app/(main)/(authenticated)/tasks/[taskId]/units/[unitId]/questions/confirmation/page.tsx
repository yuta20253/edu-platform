import { QuestionConfirmation } from "@/features/QuestionConfirmation";

type Props = {
  params: Promise<{ taskId: string; unitId: string }>;
  searchParams: Promise<{ answered_question_ids?: string }>;
};

export default async function QuestionConfirmationPage({
  params,
  searchParams,
}: Props) {
  const { taskId, unitId } = await params;

  const { answered_question_ids } = await searchParams;

  const answeredQuestionIds = answered_question_ids
    ? answered_question_ids.split(",").map(Number)
    : [];

  return (
    <QuestionConfirmation
      taskId={Number(taskId)}
      unitId={Number(unitId)}
      answeredQuestionIds={answeredQuestionIds}
    />
  );
}
