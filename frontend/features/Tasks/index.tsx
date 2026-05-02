"use client";

import { Box, CircularProgress } from "@mui/material";
import { useTasks } from "./hooks";
import { Presenter } from "./Presenter";

export const Tasks = () => {
  const { data, page, setPage, loading, error } = useTasks();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!data || error) {
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
        データの取得に失敗しました
      </Box>
    );
  }

  return <Presenter data={data} page={page} onPageChange={setPage} />;
};
