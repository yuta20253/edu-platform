"use client";

import { Box } from "@mui/material";
import { Presenter } from "./Presenter";
import { useAnalytics } from "./hooks";

export const Analytics = () => {
  const analytics = useAnalytics();

  if (analytics.error) {
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

  return <Presenter {...analytics} />;
};
