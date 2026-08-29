"use client";

import { Box, Card, CardContent, Typography, Pagination } from "@mui/material";
import Link from "next/link";
import { AnnouncementsData } from "./types";
import { formatPublishedAt } from "@/libs/ui/formatDate";

type Props = {
  data: AnnouncementsData;
  page: number;
  onPageChange: (page: number) => void;
};

export const Presenter = ({ data, page, onPageChange }: Props) => {
  const { announcements, meta } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Box>
        <Typography
          variant="h4"
          component="p"
          sx={{ fontWeight: "bold", my: 4, textAlign: "center" }}
        >
          お知らせ一覧
        </Typography>

        <Box display="flex" flexDirection="column" alignItems="center">
          {!announcements || announcements.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: "center" }}>
              お知らせが見つかりません
            </Typography>
          ) : (
            <>
              {announcements.map((announcement) => (
                <Card
                  key={announcement.id}
                  component={Link}
                  href={`/announcements/${announcement.id}`}
                  sx={{
                    width: "min(720px, 90vw)",
                    textDecoration: "none",
                    borderRadius: 3,
                    boxShadow: 2,
                    overflow: "hidden",
                    ":hover": { boxShadow: 4 },
                    m: 1,
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      p: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: 18,
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
                        mt: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "text.secondary",
                        }}
                      >
                        発行者: {announcement.publisher.name}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "text.secondary",
                        }}
                      >
                        {formatPublishedAt(announcement.published_at)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}

              {meta.total_pages > 1 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 3,
                    width: "100%",
                    mb: 8,
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
      </Box>
    </Box>
  );
};
