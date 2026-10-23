const ANALYTICS_TYPES = [
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

type UnderstandingScoreUnit = {
  unit_name: string;
  score: number;
};

type UnderstandingScoreCourse = {
  level_name: string;
  level_number: number;
  units: UnderstandingScoreUnit[];
};

type UnderstandingScoreSubject = {
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

type PeriodComparison<T> = {
  current: T;
  // 前期間に該当データがない科目は null
  previous: T | null;
};

export type StudyMinutesPoint = {
  date: string;
  minutes: number;
};

export type SubjectProgress = {
  subject_name: string;
  correct_rate: PeriodComparison<number>;
};

export type AnalyticsSummary = {
  streak_days: number;
  task_completion: {
    current: TaskCompletionData;
    previous: TaskCompletionData;
  };
  study_minutes: {
    // 31日以下は日別、それより長い期間は週別(date は週の初日)
    unit: "day" | "week";
    series: StudyMinutesPoint[];
    total: { current: number; previous: number };
  };
  subject_progress: SubjectProgress[];
  meta: {
    from: string;
    to: string;
    previous_from: string;
    previous_to: string;
  };
};
