"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { PerPageSelect } from "@/components/ui/PerPageSelect";
import { TableCard } from "@/components/ui/TableCard";
import { PER_PAGE_OPTIONS } from "@/constants/pagination";
import type { CoursesData, CourseOrder, CourseSort } from "./types";

type Props = {
  data: CoursesData;
  q: string;
  perPage: number;
  sort: CourseSort;
  order: CourseOrder;
  page: number;
  onSearchChange: (q: string) => void;
  onPerPageChange: (perPage: number) => void;
  onSortChange: (sort: CourseSort) => void;
  onPageChange: (page: number) => void;
};

export const Presenter = ({
  data,
  q,
  perPage,
  sort,
  order,
  page,
  onSearchChange,
  onPerPageChange,
  onSortChange,
  onPageChange,
}: Props) => {
  const { courses, meta } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          講座一覧
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          {meta.total_count} 件
        </Typography>
      </Box>

      {/* 検索・表示件数 */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          size="small"
          placeholder="講座名で検索"
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 240 }}
        />
        <PerPageSelect
          value={perPage}
          options={PER_PAGE_OPTIONS}
          onChange={onPerPageChange}
        />
      </Box>

      {/* テーブル */}
      <TableCard>
        {courses.length === 0 ? (
          <EmptyState
            message="講座が見つかりません"
            action={
              <Button variant="outlined" size="small" disabled>
                新規作成（準備中）
              </Button>
            }
          />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: colors.surface.light }}>
                  <TableCell sx={{ fontWeight: 600 }}>科目</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <TableSortLabel
                      active={sort === "level_name"}
                      direction={sort === "level_name" ? order : "asc"}
                      onClick={() => onSortChange("level_name")}
                    >
                      講座名
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    単元数
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    問題数
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course) => (
                  <TableRow
                    key={course.id}
                    hover
                    sx={{ "&:last-child td": { border: 0 } }}
                  >
                    <TableCell>{course.subject?.name ?? "-"}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        style={{
                          color: colors.brand.primary,
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        {course.level_name}レベル{course.level_number}
                      </Link>
                    </TableCell>
                    <TableCell align="right">{course.units_count}</TableCell>
                    <TableCell align="right">
                      {course.questions_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TableCard>

      {/* ページネーション */}
      <PaginationBar
        totalPages={meta.total_pages}
        page={page}
        onChange={onPageChange}
      />
    </Box>
  );
};
