import { Question } from "@/features/Question";

type Props = {
  params: Promise<{ taskId: string; unitId: string }>;
  searchParams: Promise<{ study_log_id?: string }>;
};

export default async function QuestionPage({ params, searchParams }: Props) {
  const { taskId, unitId } = await params;
  const { study_log_id } = await searchParams;

  return (
    <Question
      taskId={Number(taskId)}
      unitId={Number(unitId)}
      studyLogId={study_log_id ? Number(study_log_id) : undefined}
    />
  );
}
