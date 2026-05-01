import { Task } from "../types";

export const calcProgress = (tasks?: Task[] | null) => {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed_at).length;
  return Math.round((completed / tasks.length) * 100);
};
