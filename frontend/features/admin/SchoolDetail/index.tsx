"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useSchoolDetail } from "./hooks";

type Props = {
  schoolId: number;
};

export const SchoolDetail = ({ schoolId }: Props) => {
  const { school, error, retry } = useSchoolDetail(schoolId);

  return (
    <AsyncBoundary
      data={school}
      error={error}
      onRetry={retry}
      fallback="card-skeleton"
      skeletonProps={{ lines: 5 }}
    >
      {(detail) => <Presenter school={detail} />}
    </AsyncBoundary>
  );
};
