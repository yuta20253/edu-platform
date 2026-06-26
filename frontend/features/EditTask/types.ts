import { Status } from "@/types/common/status";
import { Unit } from "@/types/tasks/unit";

export type Task = {
  id: number;
  goal_id: number;
  title: string;
  content: string;
  due_date: string;
  priority: string;
  status: Status;
  completed_at: string;
  units?: Unit[];
};

export type EditTaskForm = {
  title: string;
  content: string;
  due_date: string;
  priority: string;
  units?: Unit[];
};

export type TaskUnit = Unit& {
  started: boolean;
};
