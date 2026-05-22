export type QuestionHistory = {
  question_id: number;
  question_text: string;
  correct_answer: string;
  selected_choice_number: number;
  status: AnswerStatus;
};

type AnswerStatus = "answered" | "unanswered";
