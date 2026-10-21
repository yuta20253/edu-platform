"use client";

import { Box } from "@mui/material";
import { Presenter } from "./Presenter";
import { useRankSelection } from "./hooks/useRankSelection";
import { useAnalyticsSummary } from "./hooks/useAnalyticsSummary";
import { useCumulativeAnalytics } from "./hooks/useCumulativeAnalytics";
import { usePeriodQuery } from "./hooks/usePeriodQuery";
import { AnalyticsContent } from "./components/AnalyticsContent";
import { AnalyticsFilters } from "./components/AnalyticsFilters";

export const Analytics = () => {
  const { period, setPeriod } = usePeriodQuery();
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    validationErrors,
  } = useAnalyticsSummary(period);
  const {
    gradeAverage,
    understandingScore,
    loading: cumulativeLoading,
  } = useCumulativeAnalytics();
  const rank = useRankSelection();

  return (
    <Presenter
      period={period}
      onPeriodChange={setPeriod}
      summary={summary}
      summaryLoading={summaryLoading}
      summaryError={summaryError}
      validationErrors={validationErrors}
      gradeAverage={gradeAverage}
      understandingScore={understandingScore}
      cumulativeLoading={cumulativeLoading}
      rankSection={
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <AnalyticsFilters
            type={rank.type}
            setType={rank.setType}
            subject={rank.subject}
            setSubject={rank.setSubject}
            courseId={rank.courseId}
            setCourseId={rank.setCourseId}
            unitId={rank.unitId}
            setUnitId={rank.setUnitId}
            courses={rank.courses}
            units={rank.units}
          />
          <AnalyticsContent type={rank.type} params={rank.params} />
        </Box>
      }
    />
  );
};
