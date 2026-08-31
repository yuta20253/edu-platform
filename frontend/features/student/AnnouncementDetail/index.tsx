"use client";

import { Box, CircularProgress } from "@mui/material";
import { useGetAnnouncement } from "./hooks/useGetAnnouncement";
import { Presenter } from "./Presenter";

type Props = {
  announcementId: number;
};

export const AnnouncementDetail = ({ announcementId }: Props) => {
  const { announcement, loading, error } = useGetAnnouncement(announcementId);

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

  if (!announcement || error) {
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

  return <Presenter announcement={announcement} />;
};
