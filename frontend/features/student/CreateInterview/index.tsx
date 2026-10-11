"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { Box, CircularProgress } from "@mui/material";
import { useCreateInterview, useGetTeachers } from "./hooks";
import { Presenter } from "./Presenter";

export const CreateInterview = () => {
  const { teachers, loading, error } = useGetTeachers();
  const { onSubmit, submitError } = useCreateInterview();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <ErrorState message="先生の一覧を取得できませんでした" />;
  }

  return (
    <Presenter
      teachers={teachers}
      onSubmit={onSubmit}
      submitError={submitError}
    />
  );
};
