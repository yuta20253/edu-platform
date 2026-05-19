"use client";

import { Box, CircularProgress } from "@mui/material";
import { useGetTask } from "./hooks";
import { Presenter } from "./Presenter";

type Props = {
  taskId: number;
  goalId?: number;
};

export const TaskDetail = ({ goalId, taskId }: Props) => {
  const { task, loading, error } = useGetTask(taskId);

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

  if (!task || error) {
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

  return <Presenter task={task} goalId={goalId} />;
};
