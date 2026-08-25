"use client";

import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import Link from "next/link";
import { Announcement } from "@/types/announcement/announcement";
import { formatPublishedAt } from "@/libs/ui/formatDate";

type Props = {
  announcement: Announcement;
};

export const Presenter = ({ announcement }: Props) => {
  return (
    <Box
      sx={{
        p: 3,
      }}
    >
      <Typography
        variant="h4"
        component="p"
        sx={{
          fontWeight: "bold",
          my: 4,
          textAlign: "center",
        }}
      >
        お知らせ詳細{" "}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 3,
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
      <Box display="flex" justifyContent="center">
        <Card
          sx={{
            width: "min(720px, 90vw)",
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: 22,
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
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  color: "text.secondary",
                }}
              >
                公開日時：{formatPublishedAt(announcement.published_at)}
              </Typography>

              <Typography
                sx={{
                  fontSize: 13,
                  color: "text.secondary",
                }}
              >
                発行者：{announcement.publisher.name}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: "#f9f9f9",
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
    </Box>
  );
};
