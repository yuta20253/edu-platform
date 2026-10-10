"use client";

import { Box } from "@mui/material";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Presenter } from "./Presenter";
import { useSchoolDetail } from "./hooks";

type Props = {
  schoolId: number;
};

export const SchoolDetail = ({ schoolId }: Props) => {
  const { school, error, retry } = useSchoolDetail(schoolId);

  if (!school) {
    if (error) {
      return <ErrorState onRetry={retry} />;
    }

    return (
      <Box sx={{ p: 3 }}>
        <CardSkeleton lines={5} />
      </Box>
    );
  }

  return <Presenter school={school} />;
};
