"use client";

import { CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";
import { useSchoolClasses } from "./hooks/useSchoolClasses";
import { Presenter } from "./Presenter";

export const SchoolClasses = () => {
  const { data, loading } = useSchoolClasses();

  if (loading || !data) {
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

  return <Presenter data={data} />;
};
