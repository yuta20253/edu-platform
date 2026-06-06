"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useFetchGoal } from "./hooks/useFetchGoal";
import { Presenter } from "./Presenter";
import { useForm } from "react-hook-form";
import { useSubmit } from "./hooks/useSubmit";

type Props = {
  goalId: number;
};

type EditGoalForm = {
  title: string;
  description: string;
  due_date: Date;
};

export const EditGoal = ({ goalId }: Props) => {
  const { goal, error, loading } = useFetchGoal(goalId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditGoalForm>();

  const { onSubmit, toast, closeToast } = useSubmit({ goalId });

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

  if (!goal || error) {
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
      goal={goal}
      register={register}
      errors={errors}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      toast={toast}
      closeToast={closeToast}
    />
  );
};
