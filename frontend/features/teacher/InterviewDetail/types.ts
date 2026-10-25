import type { PaginationMeta } from "@/types/common/pagination";
import type { InterviewRequestMessage } from "@/types/interview/interviewRequest";

export type MessagesData = {
  interview_request_messages: InterviewRequestMessage[];
  meta?: PaginationMeta;
};
