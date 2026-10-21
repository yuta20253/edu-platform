import type { CalendarEvent } from "./types";

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
