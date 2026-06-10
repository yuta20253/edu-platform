"use client";

import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useFetchCourseDetail } from "./hooks/useFetchCourseDetail";

type Props = {
  courseId: number;
};

export const AdminCourseDetail = ({ courseId }: Props) => {
  const { course } = useFetchCourseDetail(courseId);

  if (!course) {
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

  return <Presenter course={course} />;
};
