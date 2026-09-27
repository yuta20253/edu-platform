"use client";

import { Box, Typography, Pagination } from "@mui/material";
import Link from "next/link";
import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { AnnouncementsData } from "./types";
import { formatPublishedAt } from "@/libs/ui/formatDate";

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

type Props = {
  data: AnnouncementsData;
  page: number;
  onPageChange: (page: number) => void;
};

export const Presenter = ({ data, page, onPageChange }: Props) => {
  const { announcements, meta } = data;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, mt: 1, mb: 3 }}
      >
        お知らせ一覧
      </Typography>

      {!announcements || announcements.length === 0 ? (
        <Box sx={{ ...cardSx, p: 3, textAlign: "center", fontSize: 13, color: "text.secondary" }}>
          お知らせが見つかりません
        </Box>
      ) : (
        <>
          <Box sx={{ ...cardSx, overflow: "hidden" }}>
            {announcements.map((announcement, index) => (
              <Box
                key={announcement.id}
                component={Link}
                href={`/announcements/${announcement.id}`}
                sx={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  px: 2,
                  py: 1.75,
                  borderBottom:
                    index === announcements.length - 1
                      ? "none"
                      : `1px solid ${colors.border.light}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    mb: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {announcement.title}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                    発行者: {announcement.publisher.name}
                  </Typography>

                  <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                    {formatPublishedAt(announcement.published_at)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {meta.total_pages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 3,
                mb: 3,
              }}
            >
              <Pagination
                count={meta.total_pages}
                page={page}
                onChange={(_, value) => onPageChange(value)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
