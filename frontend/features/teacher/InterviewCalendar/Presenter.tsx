"use client";

import { useState } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { isSameMonth } from "date-fns";
import { colors } from "@/app/theme/colors";
import { formatMonthLabel, toDateKey } from "@/libs/calendar/calendarFormat";
import { groupInterviewsByDate } from "./calendarUtils";
import { CalendarGrid } from "./components/CalendarGrid";
import { DayInterviewList } from "./components/DayInterviewList";
import type { ScheduledInterview } from "./types";

type Props = {
  month: Date;
  today: Date;
  interviews: ScheduledInterview[];
  isLoading: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onThisMonth: () => void;
};

export const Presenter = ({
  month,
  today,
  interviews,
  isLoading,
  onPrevMonth,
  onNextMonth,
  onThisMonth,
}: Props) => {
  // 月を切り替えると親側で key が変わり再マウントされるため、初期値だけ決めればよい
  const [selectedDate, setSelectedDate] = useState(() =>
    isSameMonth(today, month) ? today : month,
  );

  const interviewsByDate = groupInterviewsByDate(interviews);
  const selectedInterviews = interviewsByDate[toDateKey(selectedDate)] ?? [];

  return (
    <Box sx={{ p: 3, width: "100%" }}>
      <Typography
        variant="h5"
        component="h1"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 3 }}
      >
        面談カレンダー
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
            {formatMonthLabel(month)}
          </Typography>
          <IconButton aria-label="次の月" onClick={onNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Button variant="outlined" size="small" onClick={onThisMonth}>
          今月
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" },
          alignItems: "start",
          gap: 3,
        }}
      >
        <CalendarGrid
          month={month}
          today={today}
          selectedDate={selectedDate}
          interviewsByDate={interviewsByDate}
          isLoading={isLoading}
          onSelectDate={setSelectedDate}
        />

        <DayInterviewList date={selectedDate} interviews={selectedInterviews} />
      </Box>
    </Box>
  );
};
