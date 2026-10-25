"use client";

import { Presenter } from "./Presenter";
import { useFetchAnalyticsSummary } from "./hooks/useFetchAnalyticsSummary";
import { useFetchCumulativeAnalytics } from "./hooks/useFetchCumulativeAnalytics";
import { useFetchRank } from "./hooks/useFetchRank";
import { usePeriodQuery } from "./hooks/usePeriodQuery";

export const Analytics = () => {
  const { period, setPeriod } = usePeriodQuery();
  const summary = useFetchAnalyticsSummary(period);
  const { gradeAverage, understandingScore } = useFetchCumulativeAnalytics();
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
      rankSelectionComplete={rank.selectionComplete}
      rank={rank.data}
      rankError={rank.error}
      onRankRetry={rank.refetch}
    />
  );
};
