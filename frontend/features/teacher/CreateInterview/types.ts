export type StudentOption = {
  id: number;
  name: string;
};

export type StudentOptionsData = {
  students: StudentOption[];
};

export type CreateInterviewForm = {
  student_id: number;
  reason_detail: string;
};
