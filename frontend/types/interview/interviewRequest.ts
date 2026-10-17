// Rails の InterviewRequestSerializer / InterviewRequestMessageSerializer に対応する型。
// enum の値は Rails の InterviewRequest と対応させること。
export type InterviewStatus =
  | "requested"
  | "scheduling"
  | "confirmed"
  | "completed"
  | "cancelled";

export type InterviewReasonCategory =
  | "study_method"
  | "study_plan"
  | "academic_performance"
  | "career"
  | "school_life"
  | "mental"
  | "other";

export type InterviewRequest = {
  id: number;
  status: InterviewStatus;
  initiator_role: "teacher" | "student";
  reason_category: InterviewReasonCategory | null;
  reason_detail: string;
  scheduled_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  lock_version: number;
  created_at: string;
  student_id: number;
  student_name: string;
  teacher_id: number;
  teacher_name: string;
};

export type InterviewRequestMessage = {
  id: number;
  body: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
};
