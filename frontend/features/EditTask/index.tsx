"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { Presenter } from "./Presenter";
import { useFetchTask } from "./hooks/useFetchTask";
import { useForm } from "react-hook-form";
import { EditTaskForm } from "./types";
import { useSubmit } from "./hooks/useSubmit";

type Props = {
  goalId?: number;
  taskId: number;
};

export const EditTask = ({ goalId, taskId }: Props) => {
  const { task, loading, error } = useFetchTask(taskId);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditTaskForm>();

  const { onSubmit, toast, closeToast } = useSubmit({ goalId, taskId });

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
        <Typography variant="body2" color="text.secondary">
          データの取得に失敗しました
        </Typography>
      </Box>
    );
  }

  return (
    <Presenter
      goalId={goalId}
      task={task}
      register={register}
      control={control}
      errors={errors}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      toast={toast}
      closeToast={closeToast}
    />
  );
};
