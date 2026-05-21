export type QuestionHint = {
  id: number;
  question_id: number;
  step_number: number;
  hint_text: string;
};

export type QuestionChoice = {
  id: number;
  question_id: number;
  choice_number: number;
  choice_text: string;
};

export type QuestionType = {
  id: number;
  unit_id: number;
  course_id: number;
  question_text: string;
  question_hints: QuestionHint[];
  question_choices: QuestionChoice[];
  answered: boolean;
};
