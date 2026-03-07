import { SubjectName } from "@/features/CreateTask/subject";

export const PRIORITY = {
  VERY_LOW: 1,
  LOW: 2,
  NORMAL: 3,
  HIGH: 4,
  VERY_HIGH: 5,
} as const;

export const priorities = [
  { value: PRIORITY.VERY_LOW, label: "とても低い" },
  { value: PRIORITY.LOW, label: "低い" },
  { value: PRIORITY.NORMAL, label: "普通" },
  { value: PRIORITY.HIGH, label: "高い" },
  { value: PRIORITY.VERY_HIGH, label: "とても高い" },
];

export const subjectLists: SubjectName[] = [
  "英語",
  "数学",
  "現代文",
  "古文",
  "日本史",
  "世界史",
  "地理",
  "物理",
  "化学",
  "生物",
  "地学",
];
