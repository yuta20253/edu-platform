"use client";

import { CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";
import { useState } from "react";
import { useAnnouncements } from "./hooks/useAnnouncements";
import { Presenter } from "./Presenter";
import { AnnouncementTab } from "./types";

export const Announcements = () => {
  const [tab, setTab] = useState<AnnouncementTab>("received");
  const [page, setPage] = useState(1);
  const { data, loading } = useAnnouncements(tab, page);

  const handleTabChange = (nextTab: AnnouncementTab) => {
    setTab(nextTab);
    setPage(1);
  };

  if (loading || !data) {
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
      tab={tab}
      data={data}
      page={page}
      onTabChange={handleTabChange}
      onPageChange={setPage}
    />
  );
};
