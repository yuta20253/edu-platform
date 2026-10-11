import type { PaginationMeta } from "@/types/common/pagination";
import type {
  InterviewRequest,
  InterviewStatus,
} from "@/types/interview/interviewRequest";

export type InterviewsData = {
  interview_requests: InterviewRequest[];
  meta: PaginationMeta;
};

/** "all" は status 未指定(全ステータス) */
export type InterviewStatusFilter = "all" | InterviewStatus;
