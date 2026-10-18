import type { InterviewRequest } from "@/types/interview/interviewRequest";
import type { PaginationMeta } from "@/types/common/pagination";

// GET /api/teacher/calendar のレスポンス(バックエンドの教員面談一覧APIをそのまま返す)
export type InterviewCalendarData = {
  interview_requests: InterviewRequest[];
  meta: PaginationMeta;
};

// カレンダーに載せるのは日時が決まっている面談だけ
export type ScheduledInterview = InterviewRequest & { scheduled_at: string };
