"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useFetchHistories } from "./hooks/useFetchHistories";

export const ImportHistory = () => {
  const { data, error, onRetry, ...handlers } = useFetchHistories();

  return (
    <AsyncBoundary
      data={data}
      error={error}
      onRetry={onRetry}
      fallback="card-skeleton"
      skeletonProps={{ lines: 5 }}
    >
      {(histories) => <Presenter data={histories} {...handlers} />}
    </AsyncBoundary>
  );
};
