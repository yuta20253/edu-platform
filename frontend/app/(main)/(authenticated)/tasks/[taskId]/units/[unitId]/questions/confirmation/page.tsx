import { QuestionConfirmation } from "@/features/QuestionConfirmation";

type Props = {
  params: Promise<{ taskId: string; unitId: string }>;
};

export default async function QuestionConfirmationPage({ params }: Props) {
  const { taskId, unitId } = await params;

  return (
    <QuestionConfirmation taskId={Number(taskId)} unitId={Number(unitId)} />
  );
}
