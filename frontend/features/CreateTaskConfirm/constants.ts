import { PRIORITY } from "../CreateTask/constants";

export const priorityMap: Record<number, string> = {
  [PRIORITY.VERY_LOW]: "とても低い",
  [PRIORITY.LOW]: "低い",
  [PRIORITY.NORMAL]: "普通",
  [PRIORITY.HIGH]: "高い",
  [PRIORITY.VERY_HIGH]: "とても高い",
};
