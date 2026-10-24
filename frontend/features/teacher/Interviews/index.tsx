"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useGetInterviews } from "./hooks/useGetInterviews";
import { Presenter } from "./Presenter";

export const Interviews = () => {
  const { data, page, setPage, status, setStatus, error, refetch } =
    useGetInterviews();

  // 絞り込み切替の再取得中は前回のデータを残し、セグメントが消えないようにする
  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(interviews) => (
        <Presenter
          data={interviews}
          page={page}
          onPageChange={setPage}
          status={status}
          onStatusChange={setStatus}
        />
      )}
    </AsyncBoundary>
  );
};
