import { Status } from "@/types/common/status";

export const CALENDAR_EVENT_TYPES = [
  "goal",
  "task",
  "interview_request",
] as const;

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export type InterviewRequestStatus =
  | "requested"
  | "scheduling"
  | "confirmed"
  | "completed"
  | "cancelled";

type CalendarEventBase = {
  id: number;
  // Rails の Student::CalendarService が "YYYY/MM/DD" 形式で返す
  date: string;
  title: string;
};

export type CalendarEvent =
  | (CalendarEventBase & { type: "goal"; status: Status })
  | (CalendarEventBase & { type: "task"; status: Status })
  | (CalendarEventBase & {
      type: "interview_request";
      status: InterviewRequestStatus;
    });
