"use client";

import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useFetchCourses } from "./hooks/useFetchCourses";

export const AdminCourses = () => {
  const { data, ...handlers } = useFetchCourses();

  if (!data) {
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

  return <Presenter data={data} {...handlers} />;
};
