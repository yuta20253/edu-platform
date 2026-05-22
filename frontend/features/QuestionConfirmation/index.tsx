"use client";

import { Box, CircularProgress } from "@mui/material";
import { useGetData } from "./hooks";
import { Presenter } from "./Presenter";

type Props = {
  goalId?: number;
  taskId: number;
  unitId: number;
};

export const QuestionConfirmation = ({ goalId, taskId, unitId }: Props) => {
  const { questionHistories, loading, error } = useGetData({ taskId, unitId });

  if (loading) {
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
    </Box>;
  }

  if (!questionHistories || error) {
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

  return (
    <Presenter
      goalId={goalId}
      taskId={taskId}
      unitId={unitId}
      questionHistories={questionHistories}
    />
  );
};
