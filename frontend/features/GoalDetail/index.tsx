"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { useGoal } from "./hooks";
import { Presenter } from "./Presenter";

type Props = {
  goalId: number;
};

export const GoalDetail = ({ goalId }: Props) => {
  const { goal, loading, error } = useGoal(goalId);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !goal) {
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

  return <Presenter goal={goal} />;
};
