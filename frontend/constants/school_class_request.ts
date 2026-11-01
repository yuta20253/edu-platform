import type { StatusBadgeDefinition } from "@/components/ui/StatusBadge";
import type {
  SchoolClassRequestAction,
  SchoolClassRequestStatus,
} from "@/types/schoolClassRequest/schoolClassRequest";

// StatusBadge用の学級申請ステータスのlabel/color。
export const schoolClassRequestStatusDefinitions: Record<
  SchoolClassRequestStatus,
  StatusBadgeDefinition
> = {
  pending: { label: "承認待ち", color: "warning" },
  approved: { label: "承認", color: "success" },
  rejected: { label: "却下", color: "error" },
  cancelled: { label: "取消", color: "default" },
};

// 絞り込みの選択肢などに使う、バックエンドの enum と同じ順序のステータス一覧。
export const schoolClassRequestStatuses = Object.keys(
  schoolClassRequestStatusDefinitions,
) as SchoolClassRequestStatus[];

// 申請の種別の日本語ラベル。
export const schoolClassRequestActionLabel: Record<
  SchoolClassRequestAction,
  string
> = {
  creation: "新設",
  modification: "改名",
  deletion: "削除",
};

// 申請フォームの選択肢に使う、バックエンドの enum と同じ順序の種別一覧。
export const schoolClassRequestActions = Object.keys(
  schoolClassRequestActionLabel,
) as SchoolClassRequestAction[];
