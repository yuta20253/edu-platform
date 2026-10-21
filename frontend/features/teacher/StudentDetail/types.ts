import type { Status } from "@/types/common/status";
import type { PaginationMeta } from "@/types/common/pagination";
import type { TaskPriority } from "@/types/common/priority";

export type Student = {
  id: number;
  name: string;
  name_kana: string;
  email: string;
  profile_completed: boolean;
  user_personal_info?: {
    id: number;
    phone_number: string;
    birthday: string;
    gender: string;
  };
  high_school: {
    name: string;
  };
  address?: {
    id: number;
    postal_code: string;
    city: string;
    town: string;
    prefecture: {
      id: number;
      name: string;
    };
  };
  grade: {
    year: number;
    display_name: string;
  };
};

const STUDENT_DETAIL_TABS = ["profile", "goals", "tasks"] as const;

export type StudentDetailTab = (typeof STUDENT_DETAIL_TABS)[number];

export const isStudentDetailTab = (value: string): value is StudentDetailTab =>
  (STUDENT_DETAIL_TABS as readonly string[]).includes(value);

type StudentSummary = {
  id: number;
  name: string;
};

export type StudentGoal = {
  id: number;
  title: string;
  description: string | null;
  status: Status;
  due_date: string | null;
  progress: {
    task_completed_count: number;
    task_total_count: number;
    completion_rate: number;
  };
  tasks: {
    id: number;
    title: string;
    status: Status;
    due_date: string | null;
  }[];
};

// 解答状況。未解答(answered_count が0)のときは correct_rate が null になる
type AnswerProgress = {
  total_questions: number;
  answered_count: number;
  correct_count: number;
  progress_rate: number;
  correct_rate: number | null;
};

export type StudentTaskUnit = AnswerProgress & {
  id: number;
  course_id: number;
  unit_name: string;
  course: {
    id: number;
    level_number: number;
    level_name: string;
  };
};

export type StudentTask = {
  id: number;
  title: string;
  status: Status;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  goal: {
    id: number;
    title: string;
  };
  progress: AnswerProgress;
  units: StudentTaskUnit[];
};

export type StudentGoalsData = {
  student: StudentSummary;
  goals: StudentGoal[];
};

export type StudentTasksData = {
  student: StudentSummary;
  tasks: StudentTask[];
  meta: PaginationMeta;
};

export type StudentDetailResult =
  | { tab: "profile"; data: Student }
  | { tab: "goals"; data: StudentGoalsData }
  | { tab: "tasks"; data: StudentTasksData };
