"use client";

import { useId } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import { colors } from "@/app/theme/colors";
import { cardSx, radius } from "@/app/theme/studentTheme";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDayLabelWithWeekday } from "../calendarFormat";
import { calendarEventHref } from "../calendarUtils";
import { eventTypeMeta, statusDefinitionsByType } from "../eventTypeMeta";
import type { CalendarEvent } from "../types";

type Props = {
  date: Date;
  events: CalendarEvent[];
};

export const DayEventList = ({ date, events }: Props) => {
  const headingId = useId();

  return (
    <Box component="section" aria-labelledby={headingId}>
      <Typography
        id={headingId}
        component="h2"
        sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}
      >
        {formatDayLabelWithWeekday(date)}の予定
      </Typography>

      <Box sx={{ ...cardSx, overflow: "hidden" }}>
        {events.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: "center",
              fontSize: 13,
              color: "text.secondary",
            }}
          >
            予定はありません
          </Box>
        ) : (
          events.map((event, index) => {
            const { label, color, Icon } = eventTypeMeta[event.type];
            return (
              <Box
                key={`${event.type}-${event.id}`}
                component={Link}
                href={calendarEventHref(event)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  textDecoration: "none",
                  color: "inherit",
                  px: 2,
                  py: 1.5,
                  borderBottom:
                    index === events.length - 1
                      ? "none"
                      : `1px solid ${colors.border.light}`,
                  "&:hover": { bgcolor: colors.surface.light },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: `${radius.sm}px`,
                    bgcolor: alpha(color, 0.12),
                    color,
                  }}
                >
                  <Icon fontSize="small" />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color }}>
                    {label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {event.title}
                  </Typography>
                </Box>
                <StatusBadge
                  status={event.status}
                  definitions={statusDefinitionsByType[event.type]}
                />
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};
