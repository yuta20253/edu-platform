"use client";

import { Box, CircularProgress } from "@mui/material";
import { ErrorState } from "@/components/ui/ErrorState";
import { toMonthKey } from "./calendarFormat";
import { useCalendar } from "./hooks/useCalendar";
import { Presenter } from "./Presenter";

export const Calendar = () => {
  const {
    month,
    today,
    events,
    isLoading,
    error,
    goPrevMonth,
    goNextMonth,
    goThisMonth,
    refetch,
  } = useCalendar();

  if (error) return <ErrorState onRetry={refetch} />;

  if (!month || !today) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Presenter
      // 月が変わったら選択日をその月の初期値に戻すため、月ごとに再マウントする
      key={toMonthKey(month)}
      month={month}
      today={today}
      events={events}
      isLoading={isLoading}
      onPrevMonth={goPrevMonth}
      onNextMonth={goNextMonth}
      onThisMonth={goThisMonth}
    />
  );
};
