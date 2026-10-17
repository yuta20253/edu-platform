"use client";

import { colors } from "@/app/theme/colors";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { TableCard } from "@/components/ui/TableCard";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  Box,
  Skeleton,
  Table,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

const TABLE_COLUMNS = 6;

// 初期ロード用のスケルトン。実レイアウト(KpiCards / ActivityChart /
// LowAccuracyRanking / HighSchoolUsageTable)と同じグリッドに骨格を載せる。
export const AnalyticsSkeleton = () => (
  <Box aria-label="読み込み中" aria-busy="true">
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 2,
        mb: 3,
      }}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <Box key={index} data-testid="analytics-skeleton-kpi">
          <CardSkeleton lines={3} />
        </Box>
      ))}
    </Box>

    <Box data-testid="analytics-skeleton-chart" sx={{ mb: 3 }}>
      <CardSkeleton lines={1} />
      <Skeleton
        variant="rectangular"
        height={320}
        sx={{ mt: -1, borderRadius: 2, bgcolor: colors.surface.light }}
      />
    </Box>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
        gap: 2,
        mb: 3,
      }}
    >
      {Array.from({ length: 2 }).map((_, index) => (
        <Box key={index} data-testid="analytics-skeleton-ranking">
          <CardSkeleton lines={6} />
        </Box>
      ))}
    </Box>

    <Box data-testid="analytics-skeleton-table">
      <TableCard density="compact" mb={0}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {Array.from({ length: TABLE_COLUMNS }).map((_, index) => (
                <TableCell key={index}>
                  <Skeleton variant="text" width="60%" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableSkeleton rows={5} columns={TABLE_COLUMNS} />
        </Table>
      </TableCard>
    </Box>
  </Box>
);
