import { format } from "date-fns";
import type { InterviewRequest } from "@/types/interview/interviewRequest";
import { toDateKey } from "@/libs/calendar/calendarFormat";
import type { ScheduledInterview } from "./types";

export const isScheduled = (
  interview: InterviewRequest,
): interview is ScheduledInterview => interview.scheduled_at !== null;

// scheduled_at は日時(ISO 8601)で返るため、ブラウザのタイムゾーンでの日付にまとめる
export const groupInterviewsByDate = (interviews: ScheduledInterview[]) =>
  interviews.reduce<Record<string, ScheduledInterview[]>>((acc, interview) => {
    (acc[toDateKey(new Date(interview.scheduled_at))] ??= []).push(interview);
    return acc;
  }, {});

export const formatInterviewTime = (scheduledAt: string) =>
  format(new Date(scheduledAt), "HH:mm");

export const interviewDetailHref = (id: number) => `/teacher/interviews/${id}`;
