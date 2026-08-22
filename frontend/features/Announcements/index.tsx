"use client";

import { Box, CircularProgress } from "@mui/material";
import { useGetAnnouncements } from "./hooks/useGetAnnouncements";
import { Presenter } from "./Presenter";

export const Announcements = () => {
  const { data, page, setPage, error } = useGetAnnouncements();

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        データの取得に失敗しました
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
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <Presenter data={data} page={page} onPageChange={setPage} />;
};
