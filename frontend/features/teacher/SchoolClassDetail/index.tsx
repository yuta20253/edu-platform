"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useSchoolClass } from "./hooks/useSchoolClass";
import { Presenter } from "./Presenter";

type Props = {
  schoolClassId: number;
};

export const SchoolClassDetail = ({ schoolClassId }: Props) => {
  const { data, error, refetch } = useSchoolClass(schoolClassId);

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(schoolClass) => <Presenter schoolClass={schoolClass} />}
    </AsyncBoundary>
  );
};
