import { GoalStatus } from "@/types/goals/status";
import { TaskStatus } from "@/types/tasks/status";

export type Task = {
  id: number;
  goal_id: number;
  title: string;
  content: string;
  status: TaskStatus;
  priority: number;
  due_date: string;
  unit_ids: number[] | null;
};

export type Goal = {
  id: number;
  title: string;
  description: string;
  status: GoalStatus;
  due_date: string;
  tasks: Task[];
};

export type EditGoalForm = {
  title: string;
  description: string;
  due_date: Date | null;
};
