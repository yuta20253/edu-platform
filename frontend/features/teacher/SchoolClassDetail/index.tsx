"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Presenter } from "./Presenter";
import { SchoolClassDetailType } from "./types";

type Props = {
  schoolClassId: number;
};

export const SchoolClassDetail = ({ schoolClassId }: Props) => {
  const { data, error, refetch } = useApiQuery<SchoolClassDetailType>(
    `/api/teacher/school-classes/${schoolClassId}`,
  );

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(schoolClass) => <Presenter schoolClass={schoolClass} />}
    </AsyncBoundary>
  );
};
