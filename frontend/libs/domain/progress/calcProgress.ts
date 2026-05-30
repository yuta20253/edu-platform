import { TaskStatus } from "@/types/tasks/status";

export type ProgressTask = {
  status: TaskStatus;
};

export const calcProgress = (tasks: ProgressTask[] = []) => {
  if (tasks.length === 0) return 0;

  const score = tasks.reduce((sum, task) => {
    if (task.status === "completed") return sum + 1;
    if (task.status === "in_progress") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((score / tasks.length) * 100);
};
