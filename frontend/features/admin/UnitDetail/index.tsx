"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useFetchUnitDetail } from "./hooks/useFetchUnitDetail";

type Props = {
  courseId: number;
  unitId: number;
};

export const UnitDetail = ({ courseId, unitId }: Props) => {
  const { unit, error, retry } = useFetchUnitDetail(courseId, unitId);

  return (
    <AsyncBoundary
      data={unit}
      error={error}
      onRetry={retry}
      fallback="card-skeleton"
      skeletonProps={{ lines: 5 }}
    >
      {(detail) => <Presenter unit={detail} courseId={courseId} />}
    </AsyncBoundary>
  );
};
