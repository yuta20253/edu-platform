import { GoalStatus } from "@/types/goals/goals";

export const statusLabel: Record<GoalStatus, string> = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
};