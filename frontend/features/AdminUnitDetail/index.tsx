"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { Presenter } from "./Presenter";
import { useFetchUnitDetail } from "./hooks/useFetchUnitDetail";

type Props = {
  courseId: number;
  unitId: number;
};

export const AdminUnitDetail = ({ courseId, unitId }: Props) => {
  const { unit, loading, error } = useFetchUnitDetail(courseId, unitId);

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

  if (error || !unit) {
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

  return <Presenter unit={unit} courseId={courseId} />;
};
