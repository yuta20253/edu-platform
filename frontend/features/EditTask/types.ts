import { Status } from "@/types/common/status";

export type TaskType = {
  id: number;
  goal_id: number;
  title: string;
  content: string;
  due_date: string;
  priority: string;
  status: Status;
  completed_at: string;
  units?: UnitType[];
};

export type UnitType = {
  id: number;
  course_id: number;
  unit_name: string;
  course: CourseType;
  started: boolean;
};

export type CourseType = {
  id: number;
  level_number: number;
  level_name: string;
  description: string;
  units: UnitType[];
};

export type EditTaskForm = {
  title: string;
  content: string;
  due_date: string;
  priority: string;
  units?: UnitType[];
};
