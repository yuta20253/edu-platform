import type { ImportHistory } from "@/types/common/import_history";
import type { Subject } from "@/types/common/subject";

export type QuestionChoice = {
  id: number;
  choice_number: number | null;
  choice_text: string;
};

export type QuestionHint = {
  id: number;
  step_number: number | null;
  hint_text: string;
};

export type QuestionExplanation = {
  id: number;
  explanation_type: string;
  explanation_text: string;
};

export type UnitQuestion = {
  id: number;
  question_text: string;
  correct_answer: string;
  choices: QuestionChoice[];
  hints: QuestionHint[];
  explanations: QuestionExplanation[];
};

export type UnitCourse = {
  id: number;
  subject: Subject | null;
  level_name: string;
  level_number: number;
};

export type UnitDetail = {
  id: number;
  course_id: number;
  unit_name: string;
  course: UnitCourse;
  questions: UnitQuestion[];
  recent_import_histories: ImportHistory[];
};
