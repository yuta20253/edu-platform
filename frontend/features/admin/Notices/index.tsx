"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { Presenter } from "./Presenter";
import { useFetchNotices } from "./hooks/useFetchNotices";

export const Notices = () => {
  const {
    data,
    error,
    page,
    setPage,
    query,
    status,
    onQueryChange,
    onStatusChange,
  } = useFetchNotices();

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          データの取得に失敗しました
        </Typography>
      </Box>
    );
  }

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

  return (
    <Presenter
      data={data}
      page={page}
      query={query}
      status={status}
      onQueryChange={onQueryChange}
      onStatusChange={onStatusChange}
      onPageChange={setPage}
    />
  );
};
