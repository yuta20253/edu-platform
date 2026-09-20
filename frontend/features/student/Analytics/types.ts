export const ANALYTICS_TYPES = [
  "task_completion",
  "understanding_score",
  "grade_average",
  "course_rank",
  "unit_rank",
] as const;

export type AnalyticsType = (typeof ANALYTICS_TYPES)[number];

export type TaskCompletionData = {
  completed_count: number;
  total_count: number;
  completion_rate: number;
};

export type UnderstandingScoreUnit = {
  unit_name: string;
  score: number;
};

export type UnderstandingScoreCourse = {
  level_name: string;
  level_number: number;
  units: UnderstandingScoreUnit[];
};

export type UnderstandingScoreSubject = {
  subject_name: string;
  courses: UnderstandingScoreCourse[];
};

export type UnderstandingScoreData = {
  subjects: UnderstandingScoreSubject[];
};

export type GradeAverageData = {
  correct_rate: { my: number; average: number };
  task_completion_rate: { my: number; average: number };
};

export type RankData = {
  rank: number | null;
  total_users: number;
};

export type AnalyticsDataMap = {
  task_completion: TaskCompletionData;
  understanding_score: UnderstandingScoreData;
  grade_average: GradeAverageData;
  course_rank: RankData;
  unit_rank: RankData;
};

export type AnalyticsResult =
  | { type: "task_completion"; data: TaskCompletionData }
  | { type: "understanding_score"; data: UnderstandingScoreData }
  | { type: "grade_average"; data: GradeAverageData }
  | { type: "course_rank"; data: RankData }
  | { type: "unit_rank"; data: RankData };
