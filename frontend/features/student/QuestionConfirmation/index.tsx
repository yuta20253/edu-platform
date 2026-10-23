"use client";

import { Box } from "@mui/material";
import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useCompleteStudyLog } from "./hooks/useCompleteStudyLog";
import { Presenter } from "./Presenter";
import { QuestionHistory } from "./types";

type Props = {
  goalId?: number;
  taskId: number;
  unitId: number;
  answeredQuestionIds?: number[];
  studyLogId?: number;
};

export const QuestionConfirmation = ({
  goalId,
  taskId,
  unitId,
  answeredQuestionIds,
  studyLogId,
}: Props) => {
  const { data, error, refetch } = useApiQuery<QuestionHistory[]>(
    `/api/student/tasks/${taskId}/units/${unitId}/confirmation`,
    { params: { answered_question_ids: answeredQuestionIds?.join(",") } },
  );

  useCompleteStudyLog({ taskId, unitId, studyLogId });

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(questionHistories) =>
        questionHistories.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            問題履歴がありません
          </Box>
        ) : (
          <Presenter
            goalId={goalId}
            taskId={taskId}
            unitId={unitId}
            questionHistories={questionHistories}
          />
        )
      }
    </AsyncBoundary>
  );
};
