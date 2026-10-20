import type { StatusBadgeDefinition } from "@/components/ui/StatusBadge";
import { Status } from "@/types/common/status";

export const statusLabel: Record<Status, string> = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
};

// StatusBadge用にlabel/colorを1つのテーブルにまとめたもの。
export const statusDefinitions: Record<Status, StatusBadgeDefinition> = {
  not_started: { label: statusLabel.not_started, color: "default" },
  in_progress: { label: statusLabel.in_progress, color: "info" },
  completed: { label: statusLabel.completed, color: "success" },
};
