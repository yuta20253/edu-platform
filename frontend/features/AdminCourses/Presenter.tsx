"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  type SelectChangeEvent,
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
import {
  PER_PAGE_OPTIONS,
  type AdminCoursesData,
  type CourseOrder,
  type CourseSort,
} from "./types";

type Props = {
  data: AdminCoursesData;
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

  const handlePerPageChange = (e: SelectChangeEvent<string>) => {
    onPerPageChange(Number(e.target.value));
  };

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
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>表示件数</InputLabel>
          <Select
            label="表示件数"
            value={String(perPage)}
            onChange={handlePerPageChange}
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <MenuItem key={option} value={String(option)}>
                {option}件
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* テーブル */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {courses.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                講座が見つかりません
              </Typography>
              <Button variant="outlined" size="small" disabled>
                新規作成（準備中）
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.surface.light }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <TableSortLabel
                        active={sort === "level_name"}
                        direction={sort === "level_name" ? order : "asc"}
                        onClick={() => onSortChange("level_name")}
                      >
                        講座名
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>科目</TableCell>
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
                      <TableCell>{course.subject?.name ?? "-"}</TableCell>
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
        </CardContent>
      </Card>

      {/* ページネーション */}
      {meta.total_pages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={meta.total_pages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};
