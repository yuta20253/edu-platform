export const PRIORITY = {
  VERY_LOW: 1,
  LOW: 2,
  NORMAL: 3,
  HIGH: 4,
  VERY_HIGH: 5,
} as const;

export const priorities = [
  { value: "very_low", label: "とても低い" },
  { value: "low", label: "低い" },
  { value: "normal", label: "普通" },
  { value: "high", label: "高い" },
  { value: "very_high", label: "とても高い" },
];
