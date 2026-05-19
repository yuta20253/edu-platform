import { Status } from "@/types/common/status";

export type Task = {
  id: number;
  goal_id: number;
  title: string;
  content: string;
  due_date: string;
  priority: string;
  status: Status;
  completed_at: string;
};

export type TaskMeta = {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
};

export type TasksData = {
  tasks: Task[];
  meta: TaskMeta;
};
