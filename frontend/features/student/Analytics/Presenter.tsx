"use client";

import { Box, Stack, Typography } from "@mui/material";
import { ReactNode, useId } from "react";
import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { SubjectName } from "@/constants/subject";
import { Course } from "@/types/tasks/course";
import { Unit } from "@/types/tasks/unit";
import { AnalyticsPeriod } from "./period";
import {
  AnalyticsSummary,
  GradeAverageData,
  RankData,
  RankType,
  UnderstandingScoreData,
} from "./types";
import { DashboardCard } from "./components/DashboardCard";
import { GradeAverageChart } from "./components/GradeAverageChart";
import { PeriodChips } from "./components/PeriodChips";
import { RankContent } from "./components/RankContent";
import { RankFilters } from "./components/RankFilters";
import { StreakCard } from "./components/StreakCard";
import { StudyMinutesChart } from "./components/StudyMinutesChart";
import { SubjectProgressCard } from "./components/SubjectProgressCard";
import { TaskCompletionCard } from "./components/TaskCompletionCard";
import { UnderstandingScoreChart } from "./components/UnderstandingScoreChart";

type Props = {
  period: AnalyticsPeriod;
  onPeriodChange: (period: AnalyticsPeriod) => void;
  summary: AnalyticsSummary | null;
  // 期間の切替中で、summary は前の期間の結果。カードを残したまま薄く表示する
  summaryRefreshing: boolean;
  summaryError: boolean;
  // 422(期間不正)のメッセージ。期間チップの直下に出す
  validationErrors: string[];
  onSummaryRetry: () => void;
  gradeAverage: GradeAverageData | null;
  gradeAverageError: boolean;
  onGradeAverageRetry: () => void;
  understandingScore: UnderstandingScoreData | null;
  understandingScoreError: boolean;
  onUnderstandingScoreRetry: () => void;
  rankType: RankType;
  onRankTypeChange: (type: RankType) => void;
  rankSubject: SubjectName | null;
  onRankSubjectChange: (subject: SubjectName) => void;
  rankCourseId: number | null;
  onRankCourseIdChange: (courseId: number) => void;
  rankUnitId: number | null;
  onRankUnitIdChange: (unitId: number) => void;
  rankCourses: Course[] | null;
  rankUnits: Unit[];
  // 教科→コース(→単元)を選び終えているか
  rankSelectionComplete: boolean;
  rank: RankData | null;
  rankError: boolean;
  onRankRetry: () => void;
};

type CumulativeCardProps<T> = {
  title: string;
  data: T | null;
  error: boolean;
  onRetry: () => void;
  children: (data: T) => ReactNode;
};

// 片方の取得に失敗しても、もう片方のカードは表示できるようカードごとに分岐する
const CumulativeCard = <T,>({
  title,
  data,
  error,
  onRetry,
  children,
}: CumulativeCardProps<T>) => (
  <DashboardCard title={title} headingLevel="h3">
    <AsyncBoundary data={data} error={error} onRetry={onRetry}>
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
  summaryRefreshing,
  summaryError,
  validationErrors,
  onSummaryRetry,
  gradeAverage,
  gradeAverageError,
  onGradeAverageRetry,
  understandingScore,
  understandingScoreError,
  onUnderstandingScoreRetry,
  rankType,
  onRankTypeChange,
  rankSubject,
  onRankSubjectChange,
  rankCourseId,
  onRankCourseIdChange,
  rankUnitId,
  onRankUnitIdChange,
  rankCourses,
  rankUnits,
  rankSelectionComplete,
  rank,
  rankError,
  onRankRetry,
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
          validationErrors={validationErrors}
        />

        {/* 422 はチップの直下にメッセージを出すので、ここでは何も出さない */}
        {validationErrors.length === 0 && (
          <AsyncBoundary
            data={summary}
            error={summaryError}
            onRetry={onSummaryRetry}
          >
            {(data) => (
              <SummaryCards summary={data} refreshing={summaryRefreshing} />
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
            <CumulativeCard
              title="学年平均との比較"
              data={gradeAverage}
              error={gradeAverageError}
              onRetry={onGradeAverageRetry}
            >
              {(data) => <GradeAverageChart data={data} />}
            </CumulativeCard>
            <CumulativeCard
              title="単元別の理解度"
              data={understandingScore}
              error={understandingScoreError}
              onRetry={onUnderstandingScoreRetry}
            >
              {(data) => <UnderstandingScoreChart data={data} />}
            </CumulativeCard>
            <DashboardCard title="順位" headingLevel="h3">
              <Stack spacing={2}>
                <RankFilters
                  type={rankType}
                  setType={onRankTypeChange}
                  subject={rankSubject}
                  setSubject={onRankSubjectChange}
                  courseId={rankCourseId}
                  setCourseId={onRankCourseIdChange}
                  unitId={rankUnitId}
                  setUnitId={onRankUnitIdChange}
                  courses={rankCourses}
                  units={rankUnits}
                />
                <RankContent
                  type={rankType}
                  selectionComplete={rankSelectionComplete}
                  data={rank}
                  error={rankError}
                  onRetry={onRankRetry}
                />
              </Stack>
            </DashboardCard>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};
