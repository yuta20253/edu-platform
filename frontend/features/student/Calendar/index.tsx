"use client";

import { ErrorState } from "@/components/ui/ErrorState";
import { toMonthKey } from "./calendarFormat";
import { useCalendar } from "./hooks/useCalendar";
import { Presenter } from "./Presenter";

export const Calendar = () => {
  const {
    month,
    events,
    isLoading,
    error,
    goPrevMonth,
    goNextMonth,
    goThisMonth,
  } = useCalendar();

  if (error) return <ErrorState />;

  return (
    <Presenter
      // 月が変わったら選択日をその月の初期値に戻すため、月ごとに再マウントする
      key={toMonthKey(month)}
      month={month}
      today={new Date()}
      events={events}
      isLoading={isLoading}
      onPrevMonth={goPrevMonth}
      onNextMonth={goNextMonth}
      onThisMonth={goThisMonth}
    />
  );
};
