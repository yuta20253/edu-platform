"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Announcement } from "@/types/announcement/announcement";
import { formatPublishedAt } from "@/libs/ui/formatDate";

type Props = {
  announcement: Announcement;
};

export const Presenter = ({ announcement }: Props) => {
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          お知らせ詳細
        </Typography>

        <Button
          component={Link}
          href="/teacher/announcements"
          variant="outlined"
          size="small"
          sx={{ height: 32, px: 2, textTransform: "none" }}
        >
          一覧へ戻る
        </Button>
      </Box>

      <Card
        elevation={0}
        sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            sx={{ fontWeight: "bold", fontSize: 22, mb: 2, lineHeight: 1.4 }}
          >
            {announcement.title}
          </Typography>

          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 3 }}
          >
            <Typography sx={{ fontSize: 13, color: colors.text.muted }}>
              公開日時：{formatPublishedAt(announcement.published_at)}
            </Typography>

            <Typography sx={{ fontSize: 13, color: colors.text.muted }}>
              発行者：{announcement.publisher.name}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: colors.surface.light,
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
        </CardContent>
      </Card>
    </Box>
  );
};
