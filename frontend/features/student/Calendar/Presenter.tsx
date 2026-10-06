"use client";

import { useId, useState } from "react";
import {
  Box,
  Button,
  ButtonBase,
  IconButton,
  LinearProgress,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Link from "next/link";
import { format, isSameDay, isSameMonth } from "date-fns";
import { ja } from "date-fns/locale";
import { colors } from "@/app/theme/colors";
import { cardSx, radius } from "@/app/theme/studentTheme";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  buildMonthWeeks,
  calendarEventHref,
  groupEventsByDate,
  toDateKey,
} from "./calendarUtils";
import { eventTypeMeta, statusDefinitionsByType } from "./eventTypeMeta";
import type { CalendarEvent } from "./types";

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
  events: CalendarEvent[];
  isLoading: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onThisMonth: () => void;
};

export const Presenter = ({
  month,
  today,
  events,
  isLoading,
  onPrevMonth,
  onNextMonth,
  onThisMonth,
}: Props) => {
  // 月を切り替えると親側で key が変わり再マウントされるため、初期値だけ決めればよい
  const [selectedDate, setSelectedDate] = useState(() =>
    isSameMonth(today, month) ? today : month,
  );

  const weeks = buildMonthWeeks(month);
  const eventsByDate = groupEventsByDate(events);
  const selectedEvents = eventsByDate[toDateKey(selectedDate)] ?? [];
  const selectedDayHeadingId = useId();

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, mt: 1, mb: 3 }}
      >
        カレンダー
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton aria-label="前の月" onClick={onPrevMonth} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography
            component="h2"
            sx={{
              fontSize: 18,
              fontWeight: 700,
              minWidth: 110,
              textAlign: "center",
            }}
          >
            {format(month, "yyyy年M月")}
          </Typography>
          <IconButton aria-label="次の月" onClick={onNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Button variant="outlined" size="small" onClick={onThisMonth}>
          今月
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 1.5, flexWrap: "wrap" }}>
        {Object.values(eventTypeMeta).map(({ label, color, Icon }) => (
          <Box
            key={label}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: 12,
              color: "text.secondary",
            }}
          >
            <Icon sx={{ fontSize: 16, color }} />
            {label}
          </Box>
        ))}
      </Box>

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
                  onClick={() => setSelectedDate(day)}
                  aria-pressed={isSelected}
                  aria-label={`${format(day, "M月d日")} ${
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
                    {format(day, "d")}
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

      <Box component="section" aria-labelledby={selectedDayHeadingId}>
        <Typography
          id={selectedDayHeadingId}
          component="h2"
          sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}
        >
          {format(selectedDate, "M月d日(E)", { locale: ja })}の予定
        </Typography>

        <Box sx={{ ...cardSx, overflow: "hidden" }}>
          {selectedEvents.length === 0 ? (
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
            selectedEvents.map((event, index) => {
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
                      index === selectedEvents.length - 1
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
    </Box>
  );
};
