"use client";

import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useGetGoals } from "./hooks";

export const Goals = () => {
  const { data, page, setPage, loading, error } = useGetGoals();

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
