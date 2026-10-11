// 面談(InterviewRequest)の表示ラベルと判定。
// 生徒・教員の面談画面とカレンダーで同じ表記を使うため共通化している。
import type { StatusBadgeDefinition } from "@/components/ui/StatusBadge";
import type {
  InterviewReasonCategory,
  InterviewStatus,
} from "@/types/interview/interviewRequest";

export const INTERVIEW_STATUS_DEFINITIONS: Record<
  InterviewStatus,
  StatusBadgeDefinition
> = {
  requested: { label: "申請中", color: "default" },
  scheduling: { label: "日程調整中", color: "warning" },
  confirmed: { label: "確定", color: "info" },
  completed: { label: "完了", color: "success" },
  cancelled: { label: "キャンセル", color: "default" },
};

export const INTERVIEW_STATUSES = Object.keys(
  INTERVIEW_STATUS_DEFINITIONS,
) as InterviewStatus[];

export const isInterviewStatus = (value: string): value is InterviewStatus =>
  (INTERVIEW_STATUSES as string[]).includes(value);

// キャンセルできるのは進行中(申請中・日程調整中・確定)の面談のみ。Rails の InterviewRequest#active? と対応
export const isActiveInterviewStatus = (status: InterviewStatus) =>
  status === "requested" || status === "scheduling" || status === "confirmed";

export const INTERVIEW_REASON_CATEGORY_LABELS: Record<
  InterviewReasonCategory,
  string
> = {
  study_method: "勉強方法",
  study_plan: "学習計画",
  academic_performance: "成績",
  career: "進路",
  school_life: "学校生活",
  mental: "心身の悩み",
  other: "その他",
};

export const INTERVIEW_REASON_CATEGORIES = Object.keys(
  INTERVIEW_REASON_CATEGORY_LABELS,
) as InterviewReasonCategory[];
