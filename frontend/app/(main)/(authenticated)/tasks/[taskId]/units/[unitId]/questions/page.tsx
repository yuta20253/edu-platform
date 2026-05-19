import { Question } from "@/features/Question";

type Props = {
  params: Promise<{ taskId: string; unitId: string }>;
};

export default async function QuestionPage({ params }: Props) {
  const { taskId, unitId } = await params;

  return <Question taskId={Number(taskId)} unitId={Number(unitId)} />;
}
