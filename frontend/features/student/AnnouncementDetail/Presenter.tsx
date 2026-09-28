"use client";

import { Box, Divider, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Link from "next/link";
import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { Announcement } from "@/types/announcement/announcement";
import { formatPublishedAt } from "@/libs/ui/formatDate";

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

type Props = {
  announcement: Announcement;
};

export const Presenter = ({ announcement }: Props) => {
  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Link
          href="/announcements"
          style={{
            textDecoration: "none",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
              cursor: "pointer",
              fontSize: 14,
              "&:hover": {
                color: "primary.main",
              },
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
            <Typography sx={{ fontSize: 14 }}>お知らせ一覧に戻る</Typography>
          </Box>
        </Link>
      </Box>

      <Box sx={{ ...cardSx, p: 3 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: 20,
            mb: 2,
            lineHeight: 1.4,
          }}
        >
          {announcement.title}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            mb: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              color: "text.secondary",
            }}
          >
            公開日時：{formatPublishedAt(announcement.published_at)}
          </Typography>

          <Typography
            sx={{
              fontSize: 12,
              color: "text.secondary",
            }}
          >
            発行者：{announcement.publisher.name}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            p: 2,
            borderRadius: `${radius.sm}px`,
            bgcolor: colors.surface.default,
            minHeight: 120,
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
              color: "text.primary",
            }}
          >
            {announcement.content || "内容はまだ入力されていません。"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
