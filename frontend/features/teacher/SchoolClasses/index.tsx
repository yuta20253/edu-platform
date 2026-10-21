"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useSchoolClasses } from "./hooks/useSchoolClasses";
import { Presenter } from "./Presenter";

export const SchoolClasses = () => {
  const { data, error, refetch } = useSchoolClasses();

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(grades) => <Presenter data={grades} />}
    </AsyncBoundary>
  );
};
