"use client";

import { Box, CircularProgress } from "@mui/material";
import { useGetData } from "./hooks";
import { Presenter } from "./Presenter";

type Props = {
  goalId?: number;
  taskId: number;
  unitId: number;
  answeredQuestionIds?: number[];
};

export const QuestionConfirmation = ({
  goalId,
  taskId,
  unitId,
  answeredQuestionIds,
}: Props) => {
  const { questionHistories, loading, error } = useGetData({
    taskId,
    unitId,
    answeredQuestionIds,
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          flexDirection: "column",
          gap: 1,
        }}
      >
        データの取得に失敗しました
      </Box>
    );
  }

  if (!loading && questionHistories.length === 0) {
    return (
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
    );
  }

  return (
    <Presenter
      goalId={goalId}
      taskId={taskId}
      unitId={unitId}
      questionHistories={questionHistories}
    />
  );
};
