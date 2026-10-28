export const PRIORITY = {
  VERY_LOW: 1,
  LOW: 2,
  NORMAL: 3,
  HIGH: 4,
  VERY_HIGH: 5,
} as const;

// API(Rails の enum)は優先度を文字列(very_low 〜 very_high)で返すが、
// フォームの値は数値(1〜5)なので、対応表が要る。キーの綴りは rails/app/models/draft_task.rb と同じ。
export const PRIORITY_BY_KEY: Record<string, number> = Object.fromEntries(
  Object.entries(PRIORITY).map(([key, value]) => [key.toLowerCase(), value]),
);

export const PRIORITY_VALUES: readonly number[] = Object.values(PRIORITY);

export const priorities = [
  { value: PRIORITY.VERY_LOW, label: "とても低い" },
  { value: PRIORITY.LOW, label: "低い" },
  { value: PRIORITY.NORMAL, label: "普通" },
  { value: PRIORITY.HIGH, label: "高い" },
  { value: PRIORITY.VERY_HIGH, label: "とても高い" },
];
