"use client";

import { Box } from "@mui/material";
import { ErrorState } from "@/components/ui/ErrorState";
import { useFetchDashboard } from "./hooks/useFetchDashboard";
import { Presenter } from "./Presenter";
import { Skeleton } from "./Skeleton";

export function Dashboard() {
  const { data, loading, error, refetch } = useFetchDashboard();

  if (loading) {
    return <Skeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorState message={error} onRetry={refetch} />
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return <Presenter data={data} />;
}
