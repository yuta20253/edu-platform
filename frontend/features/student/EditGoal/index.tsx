"use client";

import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { useFetchGoal } from "./hooks/useFetchGoal";
import { Presenter } from "./Presenter";
import { useForm } from "react-hook-form";
import { useSubmit } from "./hooks/useSubmit";
import { EditGoalForm } from "./types";

type Props = {
  goalId: number;
};

export const EditGoal = ({ goalId }: Props) => {
  const { goal, fetchError, refetch } = useFetchGoal(goalId);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditGoalForm>();

  const { onSubmit, toast, closeToast } = useSubmit({ goalId });

  if (fetchError) {
    return (
      <Box
        sx={{
          mt: 10,
          display: "flex",
          justifyContent: "center",
          px: 3,
        }}
      >
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              再試行
            </Button>
          }
        >
          {fetchError}
        </Alert>
      </Box>
    );
  }

  if (!goal) {
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
