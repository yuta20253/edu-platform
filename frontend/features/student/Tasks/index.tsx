"use client";

import { Box, CircularProgress } from "@mui/material";
import { useGetTasks } from "./hooks";
import { Presenter } from "./Presenter";

export const Tasks = () => {
  const { data, page, setPage, status, setStatus, loading, error } =
    useGetTasks();

  // 絞り込み切替の再取得中は前回のデータを残し、セグメントが消えないようにする
  if (loading && !data) {
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

  return (
    <Presenter
      data={data}
      page={page}
      onPageChange={setPage}
      status={status}
      onStatusChange={setStatus}
    />
  );
};
