"use client";

import { Box } from "@mui/material";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Presenter } from "./Presenter";
import { useFetchCourseDetail } from "./hooks/useFetchCourseDetail";

type Props = {
  courseId: number;
};

export const CourseDetail = ({ courseId }: Props) => {
  const { course, loading, error, retry } = useFetchCourseDetail(courseId);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <CardSkeleton lines={5} />
      </Box>
    );
  }

  if (error || !course) {
    return <ErrorState onRetry={retry} />;
  }

  return <Presenter course={course} />;
};
