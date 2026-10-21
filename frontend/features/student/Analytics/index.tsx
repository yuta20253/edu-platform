"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import { Presenter } from "./Presenter";
import { ANALYTICS_URL } from "./constants";
import { useFetchAnalyticsSummary } from "./hooks/useFetchAnalyticsSummary";
import { useFetchRank } from "./hooks/useFetchRank";
import { usePeriodQuery } from "./hooks/usePeriodQuery";
import { GradeAverageData, UnderstandingScoreData } from "./types";

export const Analytics = () => {
  const { period, setPeriod } = usePeriodQuery();
  const summary = useFetchAnalyticsSummary(period);
  // 学年平均・理解度はバックエンドが期間を受け取らない累計の集計なので、
  // 期間チップとは連動させず、画面を開いたときに取得する
  const gradeAverage = useApiQuery<GradeAverageData>(ANALYTICS_URL, {
    params: { type: "grade_average" },
  });
  const understandingScore = useApiQuery<UnderstandingScoreData>(
    ANALYTICS_URL,
    { params: { type: "understanding_score" } },
  );
  const rank = useFetchRank();

  return (
    <Presenter
      period={period}
      onPeriodChange={setPeriod}
      summary={summary.data}
      summaryRefreshing={summary.refreshing}
      summaryError={summary.error}
      validationErrors={summary.validationErrors}
      onSummaryRetry={summary.refetch}
      gradeAverage={gradeAverage.data}
      gradeAverageError={gradeAverage.error}
      onGradeAverageRetry={gradeAverage.refetch}
      understandingScore={understandingScore.data}
      understandingScoreError={understandingScore.error}
      onUnderstandingScoreRetry={understandingScore.refetch}
      rankType={rank.type}
      onRankTypeChange={rank.setType}
      rankSubject={rank.subject}
      onRankSubjectChange={rank.setSubject}
      rankCourseId={rank.courseId}
      onRankCourseIdChange={rank.setCourseId}
      rankUnitId={rank.unitId}
      onRankUnitIdChange={rank.setUnitId}
      rankCourses={rank.courses}
      rankUnits={rank.units}
      rankSelected={rank.selected}
      rank={rank.data}
      rankError={rank.error}
      onRankRetry={rank.refetch}
    />
  );
};
