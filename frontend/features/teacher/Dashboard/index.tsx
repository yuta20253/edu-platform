"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Presenter } from "./Presenter";
import { DashboardData } from "./types";

export function Dashboard() {
  const { data, error, refetch } = useApiQuery<DashboardData>(
    "/api/teacher/dashboard",
  );

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(dashboard) => <Presenter data={dashboard} />}
    </AsyncBoundary>
  );
}
