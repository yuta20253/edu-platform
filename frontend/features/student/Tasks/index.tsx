"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useGetTasks } from "./hooks";
import { Presenter } from "./Presenter";

export const Tasks = () => {
  const { data, page, setPage, status, setStatus, error, refetch } =
    useGetTasks();

  // 絞り込み切替の再取得中は前回のデータを残し、セグメントが消えないようにする
  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(tasks) => (
        <Presenter
          data={tasks}
          page={page}
          onPageChange={setPage}
          status={status}
          onStatusChange={setStatus}
        />
      )}
    </AsyncBoundary>
  );
};
