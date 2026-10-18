// 面談ステータスの判定。
import { interviewStatuses } from "@/constants/interview_request";
import type { InterviewStatus } from "@/types/interview/interviewRequest";

// クエリなど外部から来た文字列が面談ステータスかを判定する
export const isInterviewStatus = (value: string): value is InterviewStatus =>
  (interviewStatuses as string[]).includes(value);

// キャンセルできるのは進行中(申請中・日程調整中・確定)の面談のみ。バックエンドの InterviewRequest#active? と対応
export const isActiveInterviewStatus = (status: InterviewStatus) =>
  status === "requested" || status === "scheduling" || status === "confirmed";
