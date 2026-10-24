"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useGetAnnouncements } from "./hooks/useGetAnnouncements";
import { Presenter } from "./Presenter";

export const Announcements = () => {
  const { data, page, setPage, error, refetch } = useGetAnnouncements();

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(announcements) => (
        <Presenter data={announcements} page={page} onPageChange={setPage} />
      )}
    </AsyncBoundary>
  );
};
