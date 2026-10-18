// 順位だけは教科・コース・単元を選んで1種類ずつ表示する
export type RankType = "course_rank" | "unit_rank";

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
