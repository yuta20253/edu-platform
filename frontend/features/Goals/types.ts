export type Task = {
  goal_id: number;
  title: string;
  content: string;
  status: string;
  priority: number;
  due_date: Date | null;
  unit_ids: number[] | null;
};

export type Goal = {
  id: number;
  title: string;
  status: string;
  due_date: string;
  tasks: Task[];
};
