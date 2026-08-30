export type AnswerRequestBody = {
  task_id: number;
  unit_id: number;
  question_id: number;
  question_choice_id: number;
  time_spent_sec?: number;
};

export const isAnswerRequestBody = (
  value: unknown,
): value is AnswerRequestBody => {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Record<string, unknown>;

  return (
    typeof body.task_id === "number" &&
    typeof body.unit_id === "number" &&
    typeof body.question_id === "number" &&
    typeof body.question_choice_id === "number" &&
    (body.time_spent_sec === undefined ||
      typeof body.time_spent_sec === "number")
  );
};
