import type { InterviewReasonCategory } from "@/types/interview/interviewRequest";

export type Teacher = {
  id: number;
  name: string;
};

export type CreateInterviewForm = {
  teacher_id: number;
  reason_category: InterviewReasonCategory;
  reason_detail: string;
};
