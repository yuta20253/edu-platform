"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { format } from "date-fns";
import {
  announcementStatusColor,
  announcementStatusLabel,
} from "@/constants/announcement_status";
import type { DashboardAnnouncement } from "./types";

type Props = {
  announcements: DashboardAnnouncement[];
};

// ステータスごとに表示すべき日時が異なる（published_at/scheduled_at/created_at）。
// 予約配信・下書きは、それが確定した時刻ではないことが分かるよう接尾辞を添える。
const dateLabel = (announcement: DashboardAnnouncement) => {
  switch (announcement.status) {
    case "published":
      return format(new Date(announcement.published_at!), "yyyy/MM/dd HH:mm");
    case "scheduled":
      return `${format(new Date(announcement.scheduled_at!), "yyyy/MM/dd HH:mm")} 配信予定`;
    case "draft":
      return `${format(new Date(announcement.created_at), "yyyy/MM/dd")} 作成`;
  }
};

export const RecentAnnouncements = ({ announcements }: Props) => {
  return (
    <Card
      elevation={0}
      sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography fontWeight={600}>最新お知らせ</Typography>
          <Typography
            component={Link}
            href="/admin/notices"
            variant="body2"
            sx={{ color: colors.brand.primary, textDecoration: "none" }}
          >
            すべて見る
          </Typography>
        </Box>

        {announcements.length === 0 ? (
          <EmptyState
            message="お知らせがまだありません"
            py={3}
            action={
              <Button
                variant="outlined"
                component={Link}
                href="/admin/notices/new"
              >
                お知らせを作成する
              </Button>
            }
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {announcements.map((announcement) => (
              <Box
                key={announcement.id}
                component={Link}
                href={`/admin/notices/${announcement.id}`}
                sx={{
                  display: "block",
                  p: 1,
                  borderRadius: 1,
                  textDecoration: "none",
                  color: "inherit",
                  "&:hover": { bgcolor: colors.surface.light },
                }}
              >
                <Typography noWrap fontWeight={500}>
                  {announcement.title}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <Chip
                    label={announcementStatusLabel[announcement.status]}
                    size="small"
                    color={announcementStatusColor[announcement.status]}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {dateLabel(announcement)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
