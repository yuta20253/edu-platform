"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { Presenter } from "./Presenter";
import { useColleagueDetail } from "./hooks";

type Props = {
  colleagueId: number;
};

export const ColleagueDetail = ({ colleagueId }: Props) => {
  const { teacher, loading, error } = useColleagueDetail(colleagueId);

  if (loading) {
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

  if (error || !teacher) {
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
        <Typography variant="body2" color="text.secondary">
          データの取得に失敗しました
        </Typography>
      </Box>
    );
  }

  return <Presenter teacher={teacher} />;
};
