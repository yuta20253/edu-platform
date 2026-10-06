"use client";

import { useEffect, useState } from "react";
import { addMonths, startOfMonth, subMonths } from "date-fns";
import axios from "axios";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { getFetchRange } from "../calendarUtils";
import { CALENDAR_EVENT_TYPES, type CalendarEvent } from "../types";

// Rails 側で種別が追加されても、表示定義の無い種別で画面がクラッシュしないよう除外する
const isKnownEventType = (event: { type: string }) =>
  (CALENDAR_EVENT_TYPES as readonly string[]).includes(event.type);

export const useCalendar = () => {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // 月を素早く切り替えたときに古いリクエストをキャンセルして、
    // 前の月の遅れたレスポンスで新しい月の結果を上書きしないようにする
    const controller = new AbortController();

    setIsLoading(true);
    setError(false);
    // 前の月のイベントが新しい月のグリッドに一瞬表示されないようにクリアする
    setEvents([]);

    apiClient
      .get<CalendarEvent[]>("/api/student/calendar", {
        params: getFetchRange(month),
        signal: controller.signal,
      })
      .then((res) => setEvents(res.data.filter(isKnownEventType)))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [month, router]);

  const goPrevMonth = () => setMonth((current) => subMonths(current, 1));
  const goNextMonth = () => setMonth((current) => addMonths(current, 1));
  const goThisMonth = () => setMonth(startOfMonth(new Date()));

  return {
    month,
    events,
    isLoading,
    error,
    goPrevMonth,
    goNextMonth,
    goThisMonth,
  };
};
