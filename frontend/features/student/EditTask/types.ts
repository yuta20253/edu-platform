import { Status } from "@/types/common/status";
import { Unit } from "@/types/tasks/unit";
import { SubjectName } from "@/constants/subject";

export type Task = {
  id: number;
  goal_id: number;
  title: string;
  content: string;
  due_date: string;
  priority: string;
  status: Status;
  completed_at: string;
  units?: TaskUnit[];
};

export type EditTaskForm = {
  title: string;
  content: string;
  due_date: Date | null;
  priority: string;
  unit_ids: number[] | null;
};

export type TaskUnit = Unit & {
  started: boolean;
  // 既存のUnit型には無い教科・講座の表示情報(編集時の自動選択に使う)。Presenterのテストが
  // 持たないデータのため省略可能にしている
  course?: {
    id: number;
    level_number: number;
    level_name: string;
    subject_name: SubjectName;
  };
};
