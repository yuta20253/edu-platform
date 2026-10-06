"use client";

import { Box, ButtonBase, LinearProgress, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { isSameDay, isSameMonth } from "date-fns";
import { colors } from "@/app/theme/colors";
import { cardSx, radius } from "@/app/theme/studentTheme";
import { formatDayLabel, toDateKey } from "../calendarFormat";
import { buildMonthWeeks } from "../calendarUtils";
import { eventTypeMeta } from "../eventTypeMeta";
import type { CalendarEvent } from "../types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
// セル内に表示する予定の上限。超過分は「+N」で示し、詳細は下の予定一覧で確認する
const MAX_VISIBLE_EVENTS = 2;
const MAX_VISIBLE_DOTS = 3;

const weekdayColor = (index: number) => {
  if (index === 0) return colors.status.error;
  if (index === 6) return colors.status.info;
  return colors.text.secondary;
};

type Props = {
  month: Date;
  today: Date;
  selectedDate: Date;
  eventsByDate: Record<string, CalendarEvent[]>;
  isLoading: boolean;
  onSelectDate: (date: Date) => void;
};

export const CalendarGrid = ({
  month,
  today,
  selectedDate,
  eventsByDate,
  isLoading,
  onSelectDate,
}: Props) => {
  const weeks = buildMonthWeeks(month);

  return (
    <Box sx={{ ...cardSx, overflow: "hidden", mb: 3 }}>
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
            const dayEvents = eventsByDate[toDateKey(day)] ?? [];
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
            const inMonth = isSameMonth(day, month);
            const hiddenCount = dayEvents.length - MAX_VISIBLE_EVENTS;

            return (
              <ButtonBase
                key={toDateKey(day)}
                onClick={() => onSelectDate(day)}
                aria-pressed={isSelected}
                aria-label={`${formatDayLabel(day)} ${
                  dayEvents.length > 0
                    ? `予定${dayEvents.length}件`
                    : "予定なし"
                }`}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                  gap: 0.5,
                  minWidth: 0,
                  minHeight: { xs: 56, sm: 92 },
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
                    alignSelf: "center",
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

                {/* 予定の中身は aria-label と下の予定一覧で伝えるため、セル内の表示は装飾扱いにする */}
                <Box
                  aria-hidden
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    flexDirection: "column",
                    gap: 0.25,
                  }}
                >
                  {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                    <Box
                      key={`${event.type}-${event.id}`}
                      sx={{
                        fontSize: 10,
                        lineHeight: "16px",
                        px: 0.5,
                        borderRadius: `${radius.sm / 2}px`,
                        borderLeft: `3px solid ${eventTypeMeta[event.type].color}`,
                        bgcolor: alpha(eventTypeMeta[event.type].color, 0.1),
                        color: "text.primary",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.title}
                    </Box>
                  ))}
                  {hiddenCount > 0 && (
                    <Box
                      sx={{
                        fontSize: 10,
                        color: "text.secondary",
                        textAlign: "left",
                        px: 0.5,
                      }}
                    >
                      +{hiddenCount}
                    </Box>
                  )}
                </Box>
                <Box
                  aria-hidden
                  sx={{
                    display: { xs: "flex", sm: "none" },
                    justifyContent: "center",
                    gap: 0.375,
                  }}
                >
                  {dayEvents.slice(0, MAX_VISIBLE_DOTS).map((event) => (
                    <Box
                      key={`${event.type}-${event.id}`}
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: eventTypeMeta[event.type].color,
                      }}
                    />
                  ))}
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};
