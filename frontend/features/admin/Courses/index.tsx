"use client";

import { Box } from "@mui/material";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Presenter } from "./Presenter";
import { useFetchCourses } from "./hooks/useFetchCourses";

export const Courses = () => {
  const { data, error, onRetry, ...handlers } = useFetchCourses();

  if (!data) {
    if (error) {
      return <ErrorState onRetry={onRetry} />;
    }

    return (
      <Box sx={{ p: 3 }}>
        <CardSkeleton lines={5} />
      </Box>
    );
  }

  return <Presenter data={data} {...handlers} />;
};
