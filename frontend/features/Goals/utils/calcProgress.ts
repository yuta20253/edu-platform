import { Goal } from "../types";

export const calcProgress = (tasks: Goal["tasks"] = []) => {
    if (tasks.length === 0) return 0;
    const score = tasks.reduce((sum, task) => {
      if (task.status === "completed") return sum + 1;
      if (task.status === "in_progress") return sum + 0.5;
      return sum;
    }, 0);
    return Math.round((score / tasks.length) * 100);
  };