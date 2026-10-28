"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useGetSchoolClassRequests } from "./hooks/useGetSchoolClassRequests";
import { Presenter } from "./Presenter";

export const SchoolClassRequests = () => {
  const { data, page, setPage, status, setStatus, error, refetch } =
    useGetSchoolClassRequests();

  // 絞り込み切替の再取得中は前回のデータを残し、絞り込みが消えないようにする
  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(requests) => (
        <Presenter
          data={requests}
          page={page}
          onPageChange={setPage}
          status={status}
          onStatusChange={setStatus}
        />
      )}
    </AsyncBoundary>
  );
};
