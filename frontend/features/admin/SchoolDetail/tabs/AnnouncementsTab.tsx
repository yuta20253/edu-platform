"use client";

import {
  Box,
  Chip,
  ChipProps,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { colors } from "@/app/theme/colors";
import { useFetchAnnouncements } from "../hooks/useFetchAnnouncements";
import type { AnnouncementStatus } from "../types";

type Props = {
  schoolId: number;
};

// issue #49の共通コンポーネント仕様（ステータスバッジ）に合わせる。
const statusConfig: Record<
  AnnouncementStatus,
  { label: string; color: ChipProps["color"] }
> = {
  published: { label: "配信済み", color: "success" },
  draft: { label: "下書き", color: "default" },
  scheduled: { label: "予約配信", color: "info" },
};

export const AnnouncementsTab = ({ schoolId }: Props) => {
  const { announcements, meta, page, setPage, loading } =
    useFetchAnnouncements(schoolId);

  if (loading) {
    return null;
  }

  if (announcements.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="body1" sx={{ color: colors.text.secondary }}>
          お知らせがありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={1}>
        {announcements.map((announcement) => {
          const config = statusConfig[announcement.status];
          return (
            <Box
              key={announcement.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                border: `1px solid ${colors.border.light}`,
                borderRadius: 1,
              }}
            >
              <Typography>{announcement.title}</Typography>
              <Chip label={config.label} color={config.color} size="small" />
            </Box>
          );
        })}
      </Stack>

      {meta && meta.total_pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={meta.total_pages}
            page={page}
            onChange={(_, value) => setPage(value)}
          />
        </Box>
      )}
    </Box>
  );
};
