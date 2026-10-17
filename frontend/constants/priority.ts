import type { StatusBadgeDefinition } from "@/components/ui/StatusBadge";
import { TaskPriority } from "@/types/common/priority";

export const priorityLabel: Record<TaskPriority, string> = {
  very_low: "とても低い",
  low: "低い",
  normal: "普通",
  high: "高い",
  very_high: "とても高い",
};

// StatusBadge用にlabel/colorを1つのテーブルにまとめたもの。高いほど目立つ色にする
export const priorityDefinitions: Record<TaskPriority, StatusBadgeDefinition> =
  {
    very_low: { label: priorityLabel.very_low, color: "default" },
    low: { label: priorityLabel.low, color: "default" },
    normal: { label: priorityLabel.normal, color: "info" },
    high: { label: priorityLabel.high, color: "warning" },
    very_high: { label: priorityLabel.very_high, color: "error" },
  };
