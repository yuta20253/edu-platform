"use client";

import { colors } from "@/app/theme/colors";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableCard } from "@/components/ui/TableCard";
import { useSortToggle } from "@/hooks/useSortToggle";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { RateBar } from "./RateBar";
import { sortHighSchoolUsage } from "./selectors";
import type { HighSchoolUsage, HighSchoolUsageSort } from "./types";

type Props = {
  rows: HighSchoolUsage[];
};

type Column = {
  sort: HighSchoolUsageSort;
  label: string;
  align?: "right";
};

const COLUMNS: Column[] = [
  { sort: "high_school_name", label: "高校名" },
  { sort: "student_count", label: "在籍生徒数", align: "right" },
  { sort: "active_student_count", label: "アクティブ数", align: "right" },
  { sort: "active_rate", label: "アクティブ率" },
  { sort: "answer_count", label: "解答数", align: "right" },
  { sort: "accuracy_rate", label: "正答率", align: "right" },
];

export const HighSchoolUsageTable = ({ rows }: Props) => {
  // 既定はアクティブ率の昇順。使われていない高校を上に出して気付けるようにする。
  const { sort, order, toggleSort } = useSortToggle<HighSchoolUsageSort>(
    "active_rate",
    "asc",
  );

  return (
    <Box sx={{ mb: 3 }}>
      <TableCard density="compact" mb={0}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ p: 2 }}>
          高校別 利用状況
        </Typography>
        {rows.length === 0 ? (
          <EmptyState message="対象期間にデータがありません" />
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableCell
                      key={column.sort}
                      align={column.align}
                      sortDirection={sort === column.sort ? order : false}
                    >
                      <TableSortLabel
                        active={sort === column.sort}
                        direction={sort === column.sort ? order : "asc"}
                        onClick={() => toggleSort(column.sort)}
                      >
                        {column.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortHighSchoolUsage(rows, sort, order).map((row) => (
                  <TableRow key={row.high_school_id} hover>
                    <TableCell>
                      <Link
                        href={`/admin/schools/${row.high_school_id}`}
                        style={{ color: colors.brand.primary }}
                      >
                        {row.high_school_name}
                      </Link>
                    </TableCell>
                    <TableCell align="right">{row.student_count}</TableCell>
                    <TableCell align="right">
                      {row.active_student_count}
                    </TableCell>
                    <TableCell>
                      <RateBar value={row.active_rate} label="アクティブ率" />
                    </TableCell>
                    <TableCell align="right">
                      {row.answer_count.toLocaleString("ja-JP")}
                    </TableCell>
                    <TableCell align="right">{row.accuracy_rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TableCard>
    </Box>
  );
};
