"use client";

import { colors } from "@/app/theme/colors";
import { Box, Button, Pagination, Tab, Tabs, Typography } from "@mui/material";
import { AuthoredList } from "./components/AuthoredList";
import { ReceivedList } from "./components/ReceivedList";
import { AnnouncementsResult, AnnouncementTab } from "./types";

type Props = {
  tab: AnnouncementTab;
  data: AnnouncementsResult;
  page: number;
  onTabChange: (tab: AnnouncementTab) => void;
  onPageChange: (page: number) => void;
};

export const Presenter = ({
  tab,
  data,
  page,
  onTabChange,
  onPageChange,
}: Props) => {
  const { meta } = data.data;

  return (
    <Box sx={{ p: 3, width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          width: "100%",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          お知らせ一覧
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" sx={{ color: colors.text.muted }}>
            {meta.total_count}件
          </Typography>

          <Button
            variant="outlined"
            size="small"
            disabled
            sx={{
              minWidth: 110,
              height: 36,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            新規作成
          </Button>
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, value: AnnouncementTab) => onTabChange(value)}
        sx={{ mb: 3, borderBottom: `1px solid ${colors.border.light}` }}
      >
        <Tab label="受信したお知らせ" value="received" />
        <Tab label="自分が作成したお知らせ" value="authored" />
      </Tabs>

      {data.tab === "received" ? (
        <ReceivedList announcements={data.data.announcements} />
      ) : (
        <AuthoredList announcements={data.data.announcements} />
      )}

      {meta.total_pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <Pagination
            count={meta.total_pages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
};
