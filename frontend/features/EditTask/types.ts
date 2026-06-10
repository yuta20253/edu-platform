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
  units?: Unit[];
};

export type Unit = {
  id: number;
  course_id: number;
  unit_name: string;
  course: Course;
};

export type Course = {
  id: number;
  level_number: number;
  level_name: string;
};

export type EditTaskForm = {
  title: string;
  content: string;
  due_date: string;
  priority: string;
  units?: Unit[];
};
