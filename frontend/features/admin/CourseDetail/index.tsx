"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useFetchCourseDetail } from "./hooks/useFetchCourseDetail";

type Props = {
  courseId: number;
};

export const CourseDetail = ({ courseId }: Props) => {
  const { course, error, retry } = useFetchCourseDetail(courseId);

  return (
    <AsyncBoundary
      data={course}
      error={error}
      onRetry={retry}
      fallback="card-skeleton"
      skeletonProps={{ lines: 5 }}
    >
      {(detail) => <Presenter course={detail} />}
    </AsyncBoundary>
  );
};
