"use client";

import { Box, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useColleagueDetail } from "./hooks";

type Props = {
  colleagueId: number;
};

export const ColleagueDetail = ({ colleagueId }: Props) => {
  const { teacher } = useColleagueDetail(colleagueId);

  if (!teacher) {
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

  return <Presenter teacher={teacher} />;
};
