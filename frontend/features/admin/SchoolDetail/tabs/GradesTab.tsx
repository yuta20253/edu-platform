"use client";

import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { colors } from "@/app/theme/colors";
import { useFetchGrades } from "../hooks/useFetchGrades";

type Props = {
  schoolId: number;
};

export const GradesTab = ({ schoolId }: Props) => {
  const { grades, loading } = useFetchGrades(schoolId);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (grades.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="body1" sx={{ color: colors.text.secondary }}>
          学年が登録されていません
        </Typography>
      </Box>
    );
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {grades.map((grade) => (
        <Chip key={grade.id} label={grade.display_name} />
      ))}
    </Stack>
  );
};
