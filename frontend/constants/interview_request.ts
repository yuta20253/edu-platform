import type { StatusBadgeDefinition } from "@/components/ui/StatusBadge";
import type {
  InterviewReasonCategory,
  InterviewStatus,
} from "@/types/interview/interviewRequest";

// StatusBadge用の面談ステータスのlabel/color。生徒・教員の面談画面とカレンダーで共通に使う。
export const interviewStatusDefinitions: Record<
  InterviewStatus,
  StatusBadgeDefinition
> = {
  requested: { label: "申請中", color: "default" },
  scheduling: { label: "日程調整中", color: "warning" },
  confirmed: { label: "確定", color: "info" },
  completed: { label: "完了", color: "success" },
  cancelled: { label: "キャンセル", color: "default" },
};

// 絞り込みの選択肢などに使う、バックエンドの enum と同じ順序のステータス一覧。
export const interviewStatuses = Object.keys(
  interviewStatusDefinitions,
) as InterviewStatus[];

// 相談カテゴリの日本語ラベル。
export const interviewReasonCategoryLabel: Record<
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

// 申請フォームの選択肢に使う、バックエンドの enum と同じ順序の相談カテゴリ一覧。
export const interviewReasonCategories = Object.keys(
  interviewReasonCategoryLabel,
) as InterviewReasonCategory[];
