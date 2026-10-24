"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useFetchDashboard } from "./hooks/useFetchDashboard";
import { Presenter } from "./Presenter";
import { Skeleton } from "./Skeleton";

export function Dashboard() {
  const { data, error, refetch } = useFetchDashboard();

  return (
    <AsyncBoundary
      data={data}
      error={error !== null}
      errorMessage={error ?? undefined}
      onRetry={refetch}
      fallback={<Skeleton />}
    >
      {(dashboard) => <Presenter data={dashboard} />}
    </AsyncBoundary>
  );
}
