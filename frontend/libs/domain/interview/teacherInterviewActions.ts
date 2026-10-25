// 教員が面談詳細で取れる操作の判定。バックエンドの InterviewRequest::STATUS_TRANSITIONS と
// Teacher::ProcessInterviewRequestService::ALLOWED_STATUSES(confirmed / completed)に対応させる。
import type { InterviewRequest } from "@/types/interview/interviewRequest";
import { isActiveInterviewStatus } from "./interviewStatus";

export type TeacherInterviewActions = {
  // 日程を確定できるか(申請中・日程調整中 → 確定)
  canSchedule: boolean;
  // 完了にできるか(確定 → 完了)
  canComplete: boolean;
  // 終わらせる操作の呼び方。生徒からの申請にまだ応じていないうちは「却下」、それ以外は「キャンセル」。
  // どちらもバックエンドでは DELETE(キャンセル)になる。進行中でなければ null
  cancelKind: "reject" | "cancel" | null;
};

export const teacherInterviewActions = ({
  status,
  initiator_role,
}: Pick<
  InterviewRequest,
  "status" | "initiator_role"
>): TeacherInterviewActions => {
  if (!isActiveInterviewStatus(status)) {
    return { canSchedule: false, canComplete: false, cancelKind: null };
  }

  return {
    canSchedule: status === "requested" || status === "scheduling",
    canComplete: status === "confirmed",
    cancelKind:
      status === "requested" && initiator_role === "student"
        ? "reject"
        : "cancel",
  };
};
