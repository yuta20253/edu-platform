export type CreateTaskForm = {
  goal_id: number;
  title: string;
  content: string;
  priority: number;
  due_date: Date | null;
  unit_ids: number[] | null;
};

export type Props = {
  selectedUnitIds: number[] | null;
};
