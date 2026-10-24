"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useFetchNotices } from "./hooks/useFetchNotices";

export const Notices = () => {
  const {
    data,
    error,
    page,
    setPage,
    query,
    status,
    onQueryChange,
    onStatusChange,
    onRetry,
  } = useFetchNotices();

  return (
    <AsyncBoundary
      data={data}
      error={error}
      onRetry={onRetry}
      fallback="card-skeleton"
      skeletonProps={{ lines: 5 }}
    >
      {(notices) => (
        <Presenter
          data={notices}
          page={page}
          query={query}
          status={status}
          onQueryChange={onQueryChange}
          onStatusChange={onStatusChange}
          onPageChange={setPage}
        />
      )}
    </AsyncBoundary>
  );
};
