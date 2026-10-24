"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useNotificationResults } from "./hooks";

export const NotificationResults = () => {
  const { data, error, refetch } = useNotificationResults();

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(results) => <Presenter data={results} />}
    </AsyncBoundary>
  );
};
