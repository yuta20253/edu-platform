import { AnalyticsType } from "./types";

export const needsCourse = (type: AnalyticsType) =>
  type === "course_rank" || type === "unit_rank";

export const needsUnit = (type: AnalyticsType) => type === "unit_rank";
