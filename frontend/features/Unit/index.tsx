"use client";

import { Box, CircularProgress } from "@mui/material";
import { useGetUnit } from "./hooks";
import { Presenter } from "./Presenter";

type Props = {
  goalId?: number;
  taskId: number;
  unitId: number;
};

export const Unit = ({ goalId, taskId, unitId }: Props) => {
  const { unit, loading, error } = useGetUnit({ taskId, unitId });

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

  if (!unit || error) {
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
    <Presenter goalId={goalId} taskId={taskId} unitId={unitId} unit={unit} />
  );
};
