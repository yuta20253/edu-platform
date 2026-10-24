"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { QuestionType } from "@/types/question/question";
import { QuestionBody } from "./QuestionBody";

type Props = {
  taskId: number;
  unitId: number;
  goalId?: number;
  studyLogId?: number;
};

export const Question = ({ goalId, taskId, unitId, studyLogId }: Props) => {
  const { data, error, refetch } = useApiQuery<QuestionType[]>(
    `/api/student/tasks/${taskId}/units/${unitId}/questions`,
  );

  // refetch は取得失敗時の再試行にだけ使う。成功後に再取得して
  // questions が差し替わり、出題の位置がずれることがないようにする
  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(questions) => (
        <QuestionBody
          questions={questions}
          taskId={taskId}
          unitId={unitId}
          goalId={goalId}
          studyLogId={studyLogId}
        />
      )}
    </AsyncBoundary>
  );
};
