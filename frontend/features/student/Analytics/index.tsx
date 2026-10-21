"use client";

import { Box } from "@mui/material";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Presenter } from "./Presenter";
import { useAnalyticsSummary } from "./hooks/useAnalyticsSummary";
import { usePeriodQuery } from "./hooks/usePeriodQuery";
import { useRankSelection } from "./hooks/useRankSelection";
import { AnalyticsContent } from "./components/AnalyticsContent";
import { AnalyticsFilters } from "./components/AnalyticsFilters";
import { GradeAverageData, UnderstandingScoreData } from "./types";

const ANALYTICS_URL = "/api/student/analytics";

export const Analytics = () => {
  const { period, setPeriod } = usePeriodQuery();
  const summary = useAnalyticsSummary(period);
  // 学年平均・理解度はバックエンドが期間を受け取らない累計の集計なので、
  // 期間チップとは連動させず、画面を開いたときに取得する
  const gradeAverage = useApiQuery<GradeAverageData>(ANALYTICS_URL, {
    params: { type: "grade_average" },
  });
  const understandingScore = useApiQuery<UnderstandingScoreData>(
    ANALYTICS_URL,
    { params: { type: "understanding_score" } },
  );
  const rank = useRankSelection();

  return (
    <Presenter
      period={period}
      onPeriodChange={setPeriod}
      summary={summary}
      gradeAverage={gradeAverage}
      understandingScore={understandingScore}
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
