import { GoalStatus } from "@/types/goals/status";
import { TaskStatus } from "@/types/tasks/status";

export type Goal = {
  id: number;
  title: string;
  description: string;
  status: GoalStatus;
  due_date: string;
  tasks?: Task[] | null;
};

export type Task = {
  id: number;
  title: string;
  due_date: string;
  status: TaskStatus;
  completed_at: string;
};
