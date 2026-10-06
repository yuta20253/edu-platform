import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { chunk } from "lodash";
import { toApiDate } from "./calendarFormat";
import type { CalendarEvent } from "./types";

const DAYS_IN_WEEK = 7;

const gridStart = (month: Date) => startOfWeek(startOfMonth(month));
const gridEnd = (month: Date) => endOfWeek(endOfMonth(month));

// 日曜始まりで、前後月の見切れ日を含めた週単位の日付配列を返す
export const buildMonthWeeks = (month: Date): Date[][] =>
  chunk(
    eachDayOfInterval({ start: gridStart(month), end: gridEnd(month) }),
    DAYS_IN_WEEK,
  );

// 見切れ日の予定も表示するため、グリッド全体を取得範囲にする(最大6週=42日)
export const getFetchRange = (month: Date) => ({
  from: toApiDate(gridStart(month)),
  to: toApiDate(gridEnd(month)),
});

export const groupEventsByDate = (events: CalendarEvent[]) =>
  events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    (acc[event.date] ??= []).push(event);
    return acc;
  }, {});

export const calendarEventHref = (event: CalendarEvent) => {
  switch (event.type) {
    case "goal":
      return `/goals/${event.id}`;
    case "task":
      return `/tasks/${event.id}`;
    case "interview_request":
      return `/interviews/${event.id}`;
  }
};
