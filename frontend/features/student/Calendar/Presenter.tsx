"use client";

import { useState } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { format, isSameMonth } from "date-fns";
import { groupEventsByDate, toDateKey } from "./calendarUtils";
import { CalendarGrid } from "./components/CalendarGrid";
import { DayEventList } from "./components/DayEventList";
import { eventTypeMeta } from "./eventTypeMeta";
import type { CalendarEvent } from "./types";

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

  const eventsByDate = groupEventsByDate(events);
  const selectedEvents = eventsByDate[toDateKey(selectedDate)] ?? [];

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

      <CalendarGrid
        month={month}
        today={today}
        selectedDate={selectedDate}
        eventsByDate={eventsByDate}
        isLoading={isLoading}
        onSelectDate={setSelectedDate}
      />

      <DayEventList date={selectedDate} events={selectedEvents} />
    </Box>
  );
};
