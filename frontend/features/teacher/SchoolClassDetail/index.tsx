"use client";

import { useSchoolClass } from "./hooks/useSchoolClass";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Presenter } from "./Presenter";

type Props = {
  schoolClassId: number;
};

export const SchoolClassDetail = ({ schoolClassId }: Props) => {
  const { schoolClass, loading, error } = useSchoolClass(schoolClassId);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !schoolClass) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          データの取得に失敗しました
        </Typography>
      </Box>
    );
  }

  return <Presenter schoolClass={schoolClass} />;
};
