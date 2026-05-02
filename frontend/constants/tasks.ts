type Status = "not_started" | "in_progress" | "completed";

export const statusLabel: Record<Status, string> = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
};
