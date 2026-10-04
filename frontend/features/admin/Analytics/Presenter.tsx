"use client";

import { colors } from "@/app/theme/colors";
import { ErrorState } from "@/components/ui/ErrorState";
import { Box, Typography } from "@mui/material";
import { ActivityChart } from "./ActivityChart";
import { ContentCoverage } from "./ContentCoverage";
import { FilterBar } from "./FilterBar";
import { HighSchoolUsageTable } from "./HighSchoolUsageTable";
import { KpiCards } from "./KpiCards";
import { LowAccuracyRanking } from "./LowAccuracyRanking";
import { AnalyticsSkeleton } from "./Skeleton";
import type {
  AnalyticsData,
  AnalyticsFilters,
  HighSchoolOption,
  SubjectOption,
} from "./types";

type Props = {
  data: AnalyticsData | null;
  isInitialLoading: boolean;
  // フィルタ変更による再取得中。全画面スケルトンには戻さず薄く表示する。
  isRefetching: boolean;
  error: boolean;
  validationErrors: string[];
  filters: AnalyticsFilters;
  highSchoolOptions: HighSchoolOption[];
  subjectOptions: SubjectOption[];
  onFiltersChange: (patch: Partial<AnalyticsFilters>) => void;
  onRetry: () => void;
};

export const Presenter = ({
  data,
  isInitialLoading,
  isRefetching,
  error,
  validationErrors,
  filters,
  highSchoolOptions,
  subjectOptions,
  onFiltersChange,
  onRetry,
}: Props) => (
  <Box sx={{ p: 3 }}>
    <Typography
      variant="h5"
      fontWeight={700}
      sx={{ mb: 3, color: colors.text.primary }}
    >
      分析・レポート
    </Typography>

    <FilterBar
      filters={filters}
      highSchoolOptions={highSchoolOptions}
      subjectOptions={subjectOptions}
      validationErrors={validationErrors}
      onChange={onFiltersChange}
    />

    {isInitialLoading && <AnalyticsSkeleton />}

    {error && (
      <ErrorState message="分析データの取得に失敗しました" onRetry={onRetry} />
    )}

    {!error && data && (
      <Box
        data-testid="analytics-content"
        aria-busy={isRefetching}
        sx={{
          opacity: isRefetching ? 0.5 : 1,
          transition: "opacity 0.2s",
        }}
      >
        <KpiCards kpis={data.kpis} />
        <ActivityChart data={data.daily_activity} />
        <LowAccuracyRanking
          units={data.low_accuracy_units}
          questions={data.low_accuracy_questions}
          minAnswerCount={data.meta.min_answer_count}
        />
        <HighSchoolUsageTable rows={data.high_school_usage} />
        <ContentCoverage coverage={data.content_coverage} />
      </Box>
    )}
  </Box>
);
