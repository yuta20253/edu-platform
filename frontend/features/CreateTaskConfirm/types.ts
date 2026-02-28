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

export type GoalType = {
  title: string;
  description: string;
  due_date: string;
};
