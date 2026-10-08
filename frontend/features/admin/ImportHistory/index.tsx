"use client";

import { Box } from "@mui/material";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Presenter } from "./Presenter";
import { useFetchHistories } from "./hooks/useFetchHistories";

export const ImportHistory = () => {
  const { data, error, onRetry, ...handlers } = useFetchHistories();

  if (error) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <CardSkeleton lines={5} />
      </Box>
    );
  }

  return <Presenter data={data} {...handlers} />;
};
