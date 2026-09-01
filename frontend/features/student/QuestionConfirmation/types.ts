export type QuestionHistory = {
  question_id: number;
  question_text: string;
  correct_answer: string;
  is_correct: boolean;
  selected_choice_number: number;
  status: AnswerStatus;
};

type AnswerStatus = "answered" | "unanswered";
