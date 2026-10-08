"use client";

import { Box } from "@mui/material";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Presenter } from "./Presenter";
import { useFetchUnitDetail } from "./hooks/useFetchUnitDetail";

type Props = {
  courseId: number;
  unitId: number;
};

export const UnitDetail = ({ courseId, unitId }: Props) => {
  const { unit, loading, error, retry } = useFetchUnitDetail(courseId, unitId);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <CardSkeleton lines={5} />
      </Box>
    );
  }

  if (error || !unit) {
    return <ErrorState onRetry={retry} />;
  }

  return <Presenter unit={unit} courseId={courseId} />;
};
