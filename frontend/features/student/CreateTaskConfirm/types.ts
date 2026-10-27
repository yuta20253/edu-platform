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

// 下書きタスクの API レスポンス。上の UnitType / CourseType とは形が違う
// (unit が course を持つ)ので、別名にしている。
export type DraftTaskCourseType = {
  id: number;
  level_number: number;
  level_name: string;
};

export type DraftTaskUnitType = {
  id: number;
  course_id: number;
  unit_name: string;
  course: DraftTaskCourseType;
};

export type DraftTaskType = {
  id: number;
  goal_id: number;
  title: string;
  content: string;
  priority: string;
  due_date: string | null;
  units: DraftTaskUnitType[];
};
