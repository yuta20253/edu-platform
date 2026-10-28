export const PRIORITY = {
  VERY_LOW: 1,
  LOW: 2,
  NORMAL: 3,
  HIGH: 4,
  VERY_HIGH: 5,
} as const;

// API(Rails の enum)は優先度を文字列(very_low 〜 very_high)で返すが、
// フォームの値は数値(1〜5)なので、対応表が要る。キーの綴りは rails/app/models/draft_task.rb と同じ。
const PRIORITY_BY_KEY: Record<string, number> = Object.fromEntries(
  Object.entries(PRIORITY).map(([key, value]) => [key.toLowerCase(), value]),
);

const PRIORITY_VALUES: readonly number[] = Object.values(PRIORITY);

// API の優先度をフォームの値に変換する。文字列(キー)でも、1〜5 の数値でも受け付け、
// それ以外(範囲外・不明な値・null など)は「普通」にする。
export const toPriorityValue = (raw: unknown): number => {
  if (
    typeof raw === "string" &&
    Object.prototype.hasOwnProperty.call(PRIORITY_BY_KEY, raw)
  ) {
    return PRIORITY_BY_KEY[raw];
  }

  if (typeof raw === "number" && PRIORITY_VALUES.includes(raw)) {
    return raw;
  }

  return PRIORITY.NORMAL;
};

export const priorities = [
  { value: PRIORITY.VERY_LOW, label: "とても低い" },
  { value: PRIORITY.LOW, label: "低い" },
  { value: PRIORITY.NORMAL, label: "普通" },
  { value: PRIORITY.HIGH, label: "高い" },
  { value: PRIORITY.VERY_HIGH, label: "とても高い" },
];
