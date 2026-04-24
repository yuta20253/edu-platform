"use client";

import { Presenter } from "./Presenter";
import { Box, CircularProgress } from "@mui/material";
import { useColleagues } from "./hooks";

export const Colleagues = () => {
  const { data, page, setPage } = useColleagues();

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

  return <Presenter data={data} page={page} onPageChange={setPage} />;
};
