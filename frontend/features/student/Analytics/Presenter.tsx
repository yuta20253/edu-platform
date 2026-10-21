"use client";

import { Box, Stack, Typography } from "@mui/material";
import { ReactNode, useId } from "react";
import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { AnalyticsPeriod } from "./period";
import {
  AnalyticsSummary,
  GradeAverageData,
  QueryState,
  SummaryState,
  UnderstandingScoreData,
} from "./types";
import { DashboardCard } from "./components/DashboardCard";
import { GradeAverageChart } from "./components/GradeAverageChart";
import { PeriodChips } from "./components/PeriodChips";
import { StreakCard } from "./components/StreakCard";
import { StudyMinutesChart } from "./components/StudyMinutesChart";
import { SubjectProgressCard } from "./components/SubjectProgressCard";
import { TaskCompletionCard } from "./components/TaskCompletionCard";
import { UnderstandingScoreChart } from "./components/UnderstandingScoreChart";

type Props = {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  summary: SummaryState;
  gradeAverage: QueryState<GradeAverageData>;
  understandingScore: QueryState<UnderstandingScoreData>;
  rankSection: ReactNode;
};

type CumulativeCardProps<T> = {
  title: string;
  query: QueryState<T>;
  children: (data: T) => ReactNode;
};

// 片方の取得に失敗しても、もう片方のカードは表示できるようカードごとに分岐する
const CumulativeCard = <T,>({
  title,
  query,
  children,
}: CumulativeCardProps<T>) => (
  <DashboardCard title={title} headingLevel="h3">
    <AsyncBoundary
      data={query.data}
      error={query.error}
      onRetry={query.refetch}
    >
      {children}
    </AsyncBoundary>
  </DashboardCard>
);

const SummaryCards = ({
  summary,
  refreshing,
}: {
  summary: AnalyticsSummary;
  refreshing: boolean;
}) => (
  // 期間を切り替えて再取得している間も前のカードを残し、レイアウトが跳ねないようにする
  <Stack
    data-testid="summary-cards"
    aria-busy={refreshing}
    spacing={2}
    sx={{ opacity: refreshing ? 0.5 : 1, transition: "opacity 0.2s" }}
  >
    <StreakCard streakDays={summary.streak_days} />
    <TaskCompletionCard taskCompletion={summary.task_completion} />
    <StudyMinutesChart studyMinutes={summary.study_minutes} />
    <SubjectProgressCard subjectProgress={summary.subject_progress} />
  </Stack>
);

export const Presenter = ({
  period,
  onPeriodChange,
  summary,
  gradeAverage,
  understandingScore,
  rankSection,
}: Props) => {
  const cumulativeTitleId = useId();

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, mt: 1, mb: 2 }}
      >
        学習分析
      </Typography>

      <Stack spacing={2}>
        <PeriodChips
          period={period}
          onChange={onPeriodChange}
          validationErrors={summary.validationErrors}
        />

        {/* 422 はチップの直下にメッセージを出すので、ここでは何も出さない */}
        {summary.validationErrors.length === 0 && (
          <AsyncBoundary
            data={summary.data}
            error={summary.error}
            onRetry={summary.refetch}
          >
            {(data) => (
              <SummaryCards summary={data} refreshing={summary.refreshing} />
            )}
          </AsyncBoundary>
        )}

        <Box
          component="section"
          aria-labelledby={cumulativeTitleId}
          sx={{ pt: 2 }}
        >
          <Typography
            id={cumulativeTitleId}
            variant="h2"
            sx={{ fontSize: 17, fontWeight: 800 }}
          >
            累計
          </Typography>
          <Typography sx={{ mb: 1.5, fontSize: 12, color: "text.secondary" }}>
            期間に関係なく、これまでの学習全体で集計しています
          </Typography>

          <Stack spacing={2}>
            <CumulativeCard title="学年平均との比較" query={gradeAverage}>
              {(data) => <GradeAverageChart data={data} />}
            </CumulativeCard>
            <CumulativeCard title="単元別の理解度" query={understandingScore}>
              {(data) => <UnderstandingScoreChart data={data} />}
            </CumulativeCard>
            <DashboardCard title="順位" headingLevel="h3">
              {rankSection}
            </DashboardCard>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};
