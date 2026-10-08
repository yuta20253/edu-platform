"use client";

import { Chip, Stack } from "@mui/material";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useFetchGrades } from "../hooks/useFetchGrades";

type Props = {
  schoolId: number;
};

export const GradesTab = ({ schoolId }: Props) => {
  const { grades, loading, error, refetch } = useFetchGrades(schoolId);

  if (loading) {
    return <CardSkeleton lines={2} />;
  }

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  if (grades.length === 0) {
    return <EmptyState message="学年がまだありません" />;
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {grades.map((grade) => (
        <Chip key={grade.id} label={grade.display_name} />
      ))}
    </Stack>
  );
};
