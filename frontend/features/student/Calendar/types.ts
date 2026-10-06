import { Status } from "@/types/common/status";

export type CalendarEventType = "goal" | "task" | "interview_request";

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
