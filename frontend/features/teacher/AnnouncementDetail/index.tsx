"use client";

import { useAnnouncement } from "./hooks/useAnnouncement";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Presenter } from "./Presenter";

type Props = {
  announcementId: number;
};

export const AnnouncementDetail = ({ announcementId }: Props) => {
  const { announcement, loading, error } = useAnnouncement(announcementId);

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

  if (error || !announcement) {
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

  return <Presenter announcement={announcement} />;
};
