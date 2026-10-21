"use client";

import { Box, CircularProgress } from "@mui/material";
import { ErrorState } from "@/components/ui/ErrorState";
import { toMonthKey } from "@/libs/calendar/calendarFormat";
import { useInterviewCalendar } from "./hooks/useInterviewCalendar";
import { Presenter } from "./Presenter";

export const InterviewCalendar = () => {
  const {
    month,
    today,
    interviews,
    isLoading,
    error,
    goPrevMonth,
    goNextMonth,
    goThisMonth,
    refetch,
  } = useInterviewCalendar();

  if (error) return <ErrorState onRetry={refetch} />;

  if (!month || !today) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
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
      interviews={interviews}
      isLoading={isLoading}
      onPrevMonth={goPrevMonth}
      onNextMonth={goNextMonth}
      onThisMonth={goThisMonth}
    />
  );
};
