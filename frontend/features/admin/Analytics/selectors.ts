import type {
  HighSchoolUsage,
  HighSchoolUsageSort,
  SubjectOption,
} from "./types";

// 高校別利用状況のソート。元配列は変更せず、同値は元の並びを保つ。
export const sortHighSchoolUsage = (
  rows: HighSchoolUsage[],
  sort: HighSchoolUsageSort,
  order: "asc" | "desc",
): HighSchoolUsage[] => {
  const direction = order === "asc" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const left = a.row[sort];
      const right = b.row[sort];
      const compared =
        typeof left === "string" && typeof right === "string"
          ? left.localeCompare(right, "ja")
          : Number(left) - Number(right);
      return compared !== 0 ? compared * direction : a.index - b.index;
    })
    .map(({ row }) => row);
};

// 科目の一覧APIが無いため、講座の科目をIDで重複排除して選択肢にする。
export const uniqueSubjects = (
  courses: { subject: SubjectOption | null }[],
): SubjectOption[] => {
  const byId = new Map<number, SubjectOption>();
  for (const { subject } of courses) {
    if (subject) byId.set(subject.id, subject);
  }
  return [...byId.values()].sort((a, b) => a.id - b.id);
};
