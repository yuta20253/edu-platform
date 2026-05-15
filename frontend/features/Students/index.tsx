"use client";

import { CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";
import { useStudents } from "./hooks";
import { Presenter } from "./Presenter";

export const Students = () => {
  const { data, page, loading, setPage } = useStudents();

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

  return <Presenter data={data} page={page} onPageChange={setPage} />;
};
