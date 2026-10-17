"use client";

import { Box, ButtonBase, LinearProgress, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { isSameDay, isSameMonth } from "date-fns";
import { colors } from "@/app/theme/colors";
import { formatDayLabel, toDateKey } from "@/libs/calendar/calendarFormat";
import { buildMonthWeeks } from "@/libs/calendar/monthGrid";
import { formatInterviewTime } from "../calendarUtils";
import { cardSx } from "../constants";
import type { ScheduledInterview } from "../types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
// セル内に表示する面談の上限。超過分は「+N」で示し、詳細は選択日の面談一覧で確認する
const MAX_VISIBLE_INTERVIEWS = 3;

const weekdayColor = (index: number) => {
  if (index === 0) return colors.status.error;
  if (index === 6) return colors.status.info;
  return colors.text.secondary;
};

type Props = {
  month: Date;
  today: Date;
  selectedDate: Date;
  interviewsByDate: Record<string, ScheduledInterview[]>;
  isLoading: boolean;
  onSelectDate: (date: Date) => void;
};

export const CalendarGrid = ({
  month,
  today,
  selectedDate,
  interviewsByDate,
  isLoading,
  onSelectDate,
}: Props) => {
  const weeks = buildMonthWeeks(month);

  return (
    <Box sx={{ ...cardSx, overflow: "hidden" }}>
      <Box sx={{ height: 4 }}>{isLoading && <LinearProgress />}</Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        {WEEKDAY_LABELS.map((label, index) => (
          <Typography
            key={label}
            sx={{
              textAlign: "center",
              fontSize: 12,
              fontWeight: 600,
              py: 1,
              color: weekdayColor(index),
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      {weeks.map((week) => (
        <Box
          key={toDateKey(week[0])}
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            "&:not(:last-of-type)": {
              borderBottom: `1px solid ${colors.border.light}`,
            },
          }}
        >
          {week.map((day) => {
            const dayInterviews = interviewsByDate[toDateKey(day)] ?? [];
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const inMonth = isSameMonth(day, month);
            const hiddenCount = dayInterviews.length - MAX_VISIBLE_INTERVIEWS;

            return (
              <ButtonBase
                key={toDateKey(day)}
                onClick={() => onSelectDate(day)}
                aria-pressed={isSelected}
                aria-label={`${formatDayLabel(day)} ${
                  dayInterviews.length > 0
                    ? `面談${dayInterviews.length}件`
                    : "面談なし"
                }`}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                  gap: 0.5,
                  minWidth: 0,
                  minHeight: 104,
                  p: 0.5,
                  bgcolor: isSelected ? colors.accent[100] : "transparent",
                  outline: isSelected
                    ? `2px solid ${colors.accent[600]}`
                    : "none",
                  outlineOffset: -2,
                  opacity: inMonth ? 1 : 0.45,
                  "&:hover": {
                    bgcolor: isSelected
                      ? colors.accent[100]
                      : colors.surface.light,
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    alignSelf: "flex-start",
                    width: 24,
                    height: 24,
                    lineHeight: "24px",
                    borderRadius: "50%",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: isToday ? 700 : 500,
                    bgcolor: isToday ? colors.accent[600] : "transparent",
                    color: isToday ? colors.text.inverse : "text.primary",
                  }}
                >
                  {day.getDate()}
                </Box>

                {/* 面談の中身は aria-label と選択日の面談一覧で伝えるため、セル内の表示は装飾扱いにする */}
                <Box
                  aria-hidden
                  sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}
                >
                  {dayInterviews
                    .slice(0, MAX_VISIBLE_INTERVIEWS)
                    .map((interview) => (
                      <Box
                        key={interview.id}
                        sx={{
                          fontSize: 11,
                          lineHeight: "18px",
                          px: 0.5,
                          borderRadius: 0.5,
                          borderLeft: `3px solid ${colors.kpi.amber}`,
                          bgcolor: alpha(colors.kpi.amber, 0.1),
                          color: "text.primary",
                          textAlign: "left",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {`${formatInterviewTime(interview.scheduled_at)} ${interview.student_name}`}
                      </Box>
                    ))}
                  {hiddenCount > 0 && (
                    <Box
                      sx={{
                        fontSize: 11,
                        color: "text.secondary",
                        textAlign: "left",
                        px: 0.5,
                      }}
                    >
                      +{hiddenCount}
                    </Box>
                  )}
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};
