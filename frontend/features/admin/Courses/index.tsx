"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useFetchCourses } from "./hooks/useFetchCourses";

export const Courses = () => {
  const { data, error, onRetry, ...handlers } = useFetchCourses();

  return (
    <AsyncBoundary
      data={data}
      error={error}
      onRetry={onRetry}
      fallback="card-skeleton"
      skeletonProps={{ lines: 5 }}
    >
      {(courses) => <Presenter data={courses} {...handlers} />}
    </AsyncBoundary>
  );
};
