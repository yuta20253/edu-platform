"use client";

import { useId } from "react";
import { Box, Typography } from "@mui/material";
import Link from "next/link";
import { colors } from "@/app/theme/colors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  interviewReasonCategoryLabel,
  interviewStatusDefinitions,
} from "@/constants/interview_request";
import { formatDayLabelWithWeekday } from "@/libs/calendar/calendarFormat";
import { formatInterviewTime, interviewDetailHref } from "../calendarUtils";
import { cardSx } from "../constants";
import type { ScheduledInterview } from "../types";

type Props = {
  date: Date;
  interviews: ScheduledInterview[];
};

export const DayInterviewList = ({ date, interviews }: Props) => {
  const headingId = useId();

  return (
    <Box component="section" aria-labelledby={headingId}>
      <Typography
        id={headingId}
        component="h2"
        sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}
      >
        {formatDayLabelWithWeekday(date)}の面談
      </Typography>

      <Box sx={{ ...cardSx, overflow: "hidden" }}>
        {interviews.length === 0 ? (
          <Box
            sx={{
              p: 3,
              textAlign: "center",
              fontSize: 13,
              color: "text.secondary",
            }}
          >
            面談の予定はありません
          </Box>
        ) : (
          interviews.map((interview, index) => (
            <Box
              key={interview.id}
              component={Link}
              href={interviewDetailHref(interview.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                textDecoration: "none",
                color: "inherit",
                px: 2,
                py: 1.5,
                borderBottom:
                  index === interviews.length - 1
                    ? "none"
                    : `1px solid ${colors.border.light}`,
                "&:hover": { bgcolor: colors.surface.light },
              }}
            >
              <Typography
                sx={{
                  flexShrink: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: colors.kpi.amber,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatInterviewTime(interview.scheduled_at)}
              </Typography>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {interview.student_name}
                </Typography>
                {interview.reason_category && (
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    {interviewReasonCategoryLabel[interview.reason_category]}
                  </Typography>
                )}
              </Box>
              <StatusBadge
                status={interview.status}
                definitions={interviewStatusDefinitions}
              />
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};
