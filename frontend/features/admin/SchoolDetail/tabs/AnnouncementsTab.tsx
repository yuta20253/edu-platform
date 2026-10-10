"use client";

import { Box, Stack, Typography } from "@mui/material";
import { colors } from "@/app/theme/colors";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { announcementStatusDefinitions } from "@/constants/announcement_status";
import { useFetchAnnouncements } from "../hooks/useFetchAnnouncements";

type Props = {
  schoolId: number;
};

export const AnnouncementsTab = ({ schoolId }: Props) => {
  const { announcements, meta, page, setPage, loading, error, refetch } =
    useFetchAnnouncements(schoolId);

  if (loading) {
    return <CardSkeleton lines={3} />;
  }

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  if (announcements.length === 0) {
    return <EmptyState message="お知らせがまだありません" />;
  }

  return (
    <Box>
      <Stack spacing={1}>
        {announcements.map((announcement) => (
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
            <StatusBadge
              status={announcement.status}
              definitions={announcementStatusDefinitions}
              size="small"
            />
          </Box>
        ))}
      </Stack>

      {meta && (
        <Box sx={{ mt: 3 }}>
          <PaginationBar
            totalPages={meta.total_pages}
            page={page}
            onChange={setPage}
          />
        </Box>
      )}
    </Box>
  );
};
