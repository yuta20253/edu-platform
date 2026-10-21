"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useStudents } from "./hooks";
import { Presenter } from "./Presenter";

export const Students = () => {
  const { data, error, refetch, page, setPage } = useStudents();

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(students) => (
        <Presenter data={students} page={page} onPageChange={setPage} />
      )}
    </AsyncBoundary>
  );
};
