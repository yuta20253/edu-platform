"use client";

import { Box, CircularProgress } from "@mui/material";
import { useGetQuestions } from "./hooks";
import { Presenter } from "./Presenter";

type Props = {
  taskId: number;
  unitId: number;
  goalId?: number;
};

export const Question = ({ goalId, taskId, unitId }: Props) => {
  const { questions, loading, error } = useGetQuestions({ taskId, unitId });

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

  if (!questions || !goalId || error) {
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
  return <Presenter goalId={goalId} questions={questions} />;
};
