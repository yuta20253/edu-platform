"use client";

import { Box } from "@mui/material";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
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

  if (!data) {
    if (error) {
      return <ErrorState onRetry={onRetry} />;
    }

    return (
      <Box sx={{ p: 3 }}>
        <CardSkeleton lines={5} />
      </Box>
    );
  }

  return (
    <Presenter
      data={data}
      page={page}
      query={query}
      status={status}
      onQueryChange={onQueryChange}
      onStatusChange={onStatusChange}
      onPageChange={setPage}
    />
  );
};
