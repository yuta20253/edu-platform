"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { Box, CircularProgress } from "@mui/material";
import { useGetInterviews } from "./hooks/useGetInterviews";
import { Presenter } from "./Presenter";

export const Interviews = () => {
  const { data, page, setPage, status, setStatus, error } = useGetInterviews();

  if (error) {
    return <ErrorState />;
  }

  // 絞り込み切替の再取得中は前回のデータを残し、セグメントが消えないようにする
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
