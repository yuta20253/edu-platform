"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useFetchGoal } from "./hooks/useFetchGoal";
import { Presenter } from "./Presenter";
import { useForm } from "react-hook-form";
import { useSubmit } from "./hooks/useSubmit";
import { EditGoalForm } from "./types";

type Props = {
  goalId: number;
};

export const EditGoal = ({ goalId }: Props) => {
  const { goal, error, loading } = useFetchGoal(goalId);

  const {
    register,
    control,
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
      control={control}
      errors={errors}
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      toast={toast}
      closeToast={closeToast}
    />
  );
};
