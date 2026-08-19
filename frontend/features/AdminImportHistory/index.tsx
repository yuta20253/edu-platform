"use client";

import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useFetchHistories } from "./hooks/useFetchHistories";

export const AdminImportHistory = () => {
  const { data, ...handlers } = useFetchHistories();

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
