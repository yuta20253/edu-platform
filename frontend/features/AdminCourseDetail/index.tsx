"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { Presenter } from "./Presenter";
import { useFetchCourseDetail } from "./hooks/useFetchCourseDetail";

type Props = {
  courseId: number;
};

export const AdminCourseDetail = ({ courseId }: Props) => {
  const { course, loading, error } = useFetchCourseDetail(courseId);

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

  if (error || !course) {
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

  return <Presenter course={course} />;
};
