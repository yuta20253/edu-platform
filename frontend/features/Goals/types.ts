import { GoalStatus } from "@/types/goals/status";
import { TaskStatus } from "@/types/tasks/status";

export type Task = {
  goal_id: number;
  title: string;
  content: string;
  status: TaskStatus;
  priority: number;
  due_date: Date | null;
  unit_ids: number[] | null;
};

export type Goal = {
  id: number;
  title: string;
  status: GoalStatus;
  due_date: string;
  tasks: Task[];
};
