"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { ANALYTICS_URL } from "../constants";
import { GradeAverageData, UnderstandingScoreData } from "../types";

// 学年平均・理解度はバックエンドが期間を受け取らない累計の集計なので、
// 期間チップとは連動させず、画面を開いたときに取得する。
// 片方が失敗しても、もう片方は表示できるよう別々に取得する
export const useFetchCumulativeAnalytics = () => {
  const gradeAverage = useApiQuery<GradeAverageData>(ANALYTICS_URL, {
    params: { type: "grade_average" },
  });
  const understandingScore = useApiQuery<UnderstandingScoreData>(
    ANALYTICS_URL,
    { params: { type: "understanding_score" } },
  );

  return { gradeAverage, understandingScore };
};
