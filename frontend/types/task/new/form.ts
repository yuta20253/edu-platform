export type CreateTaskForm = {
  task: {
    goal_id: number;
    title: string;
    content: string;
    priority: number;
    due_date: string;
    unit_ids: number[] | null;
  };
};

export type UnitType = {
  id: number;
  course_id: number;
  unit_name: string;
};

export type CourseType = {
  id: number;
  level_number: number;
  level_name: string;
  description: string;
  units: UnitType[];
};

export type Props = {
    selectedUnitIds: number[] | null;
    courses: CourseType[] | null;
    goalId: number;
};
