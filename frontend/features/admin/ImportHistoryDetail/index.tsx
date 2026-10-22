"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useFetchHistoryDetail } from "./hooks/useFetchHistoryDetail";

type Props = {
  historyId: number;
};

export const ImportHistoryDetail = ({ historyId }: Props) => {
  const { data, error, onRetry, ...handlers } =
    useFetchHistoryDetail(historyId);

  return (
    <AsyncBoundary
      data={data}
      error={error}
      onRetry={onRetry}
      fallback="card-skeleton"
      skeletonProps={{ lines: 5 }}
    >
      {(detail) => <Presenter data={detail} {...handlers} />}
    </AsyncBoundary>
  );
};
