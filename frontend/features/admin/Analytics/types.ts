export type KpiValue = {
  current: number;
  previous: number;
};

export type AnalyticsKpis = {
  active_student_count: KpiValue;
  answer_count: KpiValue;
  accuracy_rate: KpiValue;
  study_minutes: KpiValue;
};

export type DailyActivity = {
  date: string;
  active_student_count: number;
  answer_count: number;
  accuracy_rate: number;
};

export type LowAccuracyUnit = {
  unit_id: number;
  unit_name: string;
  course_id: number;
  course_name: string;
  subject_name: string;
  answer_count: number;
  accuracy_rate: number;
};

export type LowAccuracyQuestion = {
  question_id: number;
  question_text: string;
  unit_id: number;
  unit_name: string;
  course_id: number;
  answer_count: number;
  accuracy_rate: number;
};

export type HighSchoolUsage = {
  high_school_id: number;
  high_school_name: string;
  student_count: number;
  active_student_count: number;
  active_rate: number;
  answer_count: number;
  accuracy_rate: number;
};

export type ContentCoverage = {
  total_units: number;
  units_without_questions: number;
  units_without_answers: number;
};

export type AnalyticsMeta = {
  from: string;
  to: string;
  previous_from: string;
  previous_to: string;
  min_answer_count: number;
  ranking_limit: number;
  max_range_days: number;
  generated_at: string;
};

export type AnalyticsData = {
  kpis: AnalyticsKpis;
  daily_activity: DailyActivity[];
  low_accuracy_units: LowAccuracyUnit[];
  low_accuracy_questions: LowAccuracyQuestion[];
  high_school_usage: HighSchoolUsage[];
  content_coverage: ContentCoverage;
  meta: AnalyticsMeta;
};

// フィルタ値はURLクエリと同じく文字列で持つ（空文字=未指定）。
export type AnalyticsFilters = {
  from: string;
  to: string;
  highSchoolId: string;
  subjectId: string;
};

export type PeriodPreset = 7 | 30 | 90;

export const PERIOD_PRESETS: readonly PeriodPreset[] = [7, 30, 90];

export type HighSchoolOption = { id: number; name: string };

export type SubjectOption = { id: number; name: string };

export type HighSchoolUsageSort =
  | "high_school_name"
  | "student_count"
  | "active_student_count"
  | "active_rate"
  | "answer_count"
  | "accuracy_rate";
