"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { ReactNode, useId } from "react";
import { AnalyticsPeriod } from "./period";
import {
  AnalyticsSummary,
  GradeAverageData,
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
  summary: AnalyticsSummary | null;
  summaryLoading: boolean;
  summaryError: boolean;
  validationErrors: string[];
  gradeAverage: GradeAverageData | null;
  understandingScore: UnderstandingScoreData | null;
  cumulativeLoading: boolean;
  rankSection: ReactNode;
};

const Loading = ({ testId }: { testId?: string }) => (
  <Box
    data-testid={testId}
    sx={{ display: "flex", justifyContent: "center", py: 4 }}
  >
    <CircularProgress size={28} />
  </Box>
);

const Message = ({ children }: { children: string }) => (
  <Typography
    sx={{ py: 3, fontSize: 14, color: "text.secondary", textAlign: "center" }}
  >
    {children}
  </Typography>
);

type CumulativeCardProps<T> = {
  title: string;
  data: T | null;
  loading: boolean;
  children: (data: T) => ReactNode;
};

const CumulativeCard = <T,>({
  title,
  data,
  loading,
  children,
}: CumulativeCardProps<T>) => (
  <DashboardCard title={title} headingLevel="h3">
    {data !== null ? (
      children(data)
    ) : loading ? (
      <Loading />
    ) : (
      <Message>取得に失敗しました</Message>
    )}
  </DashboardCard>
);

const SummaryCards = ({
  summary,
  loading,
}: {
  summary: AnalyticsSummary;
  loading: boolean;
}) => (
  // 期間を切り替えて再取得している間も前のカードを残し、レイアウトが跳ねないようにする
  <Stack
    data-testid="summary-cards"
    aria-busy={loading}
    spacing={2}
    sx={{ opacity: loading ? 0.5 : 1, transition: "opacity 0.2s" }}
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
  summaryLoading,
  summaryError,
  validationErrors,
  gradeAverage,
  understandingScore,
  cumulativeLoading,
  rankSection,
}: Props) => {
  const cumulativeTitleId = useId();

  const summaryArea = () => {
    if (summary !== null) {
      return <SummaryCards summary={summary} loading={summaryLoading} />;
    }
    if (summaryLoading) return <Loading testId="summary-loading" />;
    // 422 はチップの直下にメッセージを出すので、ここでは何も出さない
    if (summaryError) return <Message>学習分析の取得に失敗しました</Message>;
    return null;
  };

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
          validationErrors={validationErrors}
        />

        {summaryArea()}

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
            <CumulativeCard
              title="学年平均との比較"
              data={gradeAverage}
              loading={cumulativeLoading}
            >
              {(data) => <GradeAverageChart data={data} />}
            </CumulativeCard>
            <CumulativeCard
              title="単元別の理解度"
              data={understandingScore}
              loading={cumulativeLoading}
            >
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
