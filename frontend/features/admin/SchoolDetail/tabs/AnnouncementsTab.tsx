"use client";

import {
  Box,
  CircularProgress,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { colors } from "@/app/theme/colors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { announcementStatusDefinitions } from "@/constants/announcement_status";
import { useFetchAnnouncements } from "../hooks/useFetchAnnouncements";

type Props = {
  schoolId: number;
};

export const AnnouncementsTab = ({ schoolId }: Props) => {
  const { announcements, meta, page, setPage, loading } =
    useFetchAnnouncements(schoolId);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
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
