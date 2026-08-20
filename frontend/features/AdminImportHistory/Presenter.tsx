"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Card,
  CardContent,
  Chip,
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
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import {
  IMPORT_STATUS_COLOR,
  IMPORT_STATUS_LABEL,
  type ImportHistoriesData,
  type ImportHistoryFilters,
  type ImportHistoryOrder,
  type ImportHistorySort,
  type ImportHistoryStatus,
} from "./types";

type CourseOption = { id: number; level_name: string };
type UnitOption = { id: number; unit_name: string };
type UserOption = { id: number; name: string };

type Props = {
  data: ImportHistoriesData;
  filters: ImportHistoryFilters;
  courseOptions: CourseOption[];
  unitOptions: UnitOption[];
  userOptions: UserOption[];
  sort: ImportHistorySort;
  order: ImportHistoryOrder;
  page: number;
  onStatusChange: (status: ImportHistoryStatus | "") => void;
  onCourseChange: (courseId: string) => void;
  onUnitChange: (unitId: string) => void;
  onUserChange: (userId: string) => void;
  onFromChange: (from: string) => void;
  onToChange: (to: string) => void;
  onSortChange: (sort: ImportHistorySort) => void;
  onPageChange: (page: number) => void;
  onRowClick: (id: number) => void;
};

const STATUS_OPTIONS: { value: ImportHistoryStatus; label: string }[] = [
  { value: "pending", label: IMPORT_STATUS_LABEL.pending },
  { value: "processing", label: IMPORT_STATUS_LABEL.processing },
  { value: "completed", label: IMPORT_STATUS_LABEL.completed },
  { value: "failed", label: IMPORT_STATUS_LABEL.failed },
];

const dateToInput = (value: string) => (value ? parseISO(value) : null);
const dateToParam = (date: Date | null) => (date ? format(date, "yyyy-MM-dd") : "");

export const Presenter = ({
  data,
  filters,
  courseOptions,
  unitOptions,
  userOptions,
  sort,
  order,
  page,
  onStatusChange,
  onCourseChange,
  onUnitChange,
  onUserChange,
  onFromChange,
  onToChange,
  onSortChange,
  onPageChange,
  onRowClick,
}: Props) => {
  const { import_histories: histories, meta } = data;

  const fromDate = dateToInput(filters.from);
  const toDate = dateToInput(filters.to);
  const dateRangeInvalid = !!fromDate && !!toDate && fromDate > toDate;

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    onStatusChange(e.target.value as ImportHistoryStatus | "");
  };

  const handleCourseChange = (e: SelectChangeEvent<string>) => {
    onCourseChange(e.target.value);
  };

  const handleUnitChange = (e: SelectChangeEvent<string>) => {
    onUnitChange(e.target.value);
  };

  const handleUserChange = (e: SelectChangeEvent<string>) => {
    onUserChange(e.target.value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          インポート履歴一覧
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          {meta.total_count} 件
        </Typography>
      </Box>

      {/* フィルタ */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="import-history-status-label">ステータス</InputLabel>
          <Select
            labelId="import-history-status-label"
            label="ステータス"
            value={filters.status}
            onChange={handleStatusChange}
          >
            <MenuItem value="">すべて</MenuItem>
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="import-history-course-label">コース</InputLabel>
          <Select
            labelId="import-history-course-label"
            label="コース"
            value={filters.courseId}
            onChange={handleCourseChange}
          >
            <MenuItem value="">すべて</MenuItem>
            {courseOptions.map((course) => (
              <MenuItem key={course.id} value={String(course.id)}>
                {course.level_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="import-history-unit-label">単元</InputLabel>
          <Select
            labelId="import-history-unit-label"
            label="単元"
            value={filters.unitId}
            onChange={handleUnitChange}
          >
            <MenuItem value="">すべて</MenuItem>
            {unitOptions.map((unit) => (
              <MenuItem key={unit.id} value={String(unit.id)}>
                {unit.unit_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="import-history-user-label">実行者</InputLabel>
          <Select
            labelId="import-history-user-label"
            label="実行者"
            value={filters.userId}
            onChange={handleUserChange}
          >
            <MenuItem value="">すべて</MenuItem>
            {userOptions.map((user) => (
              <MenuItem key={user.id} value={String(user.id)}>
                {user.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
          <DatePicker
            label="開始日"
            format="yyyy/MM/dd"
            value={fromDate}
            maxDate={toDate ?? undefined}
            onChange={(date) => onFromChange(dateToParam(date))}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="終了日"
            format="yyyy/MM/dd"
            value={toDate}
            minDate={fromDate ?? undefined}
            onChange={(date) => onToChange(dateToParam(date))}
            slotProps={{
              textField: {
                size: "small",
                error: dateRangeInvalid,
                helperText: dateRangeInvalid
                  ? "終了日は開始日以降の日付を指定してください"
                  : undefined,
              },
            }}
          />
        </LocalizationProvider>
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
          {histories.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography color="text.secondary">
                インポート履歴が見つかりません
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.surface.light }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <TableSortLabel
                        active={sort === "created_at"}
                        direction={sort === "created_at" ? order : "desc"}
                        onClick={() => onSortChange("created_at")}
                      >
                        日時
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>コース</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>単元</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      <TableSortLabel
                        active={sort === "total_count"}
                        direction={sort === "total_count" ? order : "asc"}
                        onClick={() => onSortChange("total_count")}
                      >
                        件数
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      成功数/エラー数
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>実行者</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <TableSortLabel
                        active={sort === "status"}
                        direction={sort === "status" ? order : "asc"}
                        onClick={() => onSortChange("status")}
                      >
                        ステータス
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {histories.map((history) => (
                    <TableRow
                      key={history.id}
                      hover
                      onClick={() => onRowClick(history.id)}
                      sx={{
                        cursor: "pointer",
                        "&:last-child td": { border: 0 },
                      }}
                    >
                      <TableCell>
                        {format(new Date(history.created_at), "yyyy/MM/dd HH:mm")}
                      </TableCell>
                      <TableCell>{history.course?.level_name ?? "-"}</TableCell>
                      <TableCell>{history.unit?.unit_name ?? "-"}</TableCell>
                      <TableCell align="right">{history.total_count}</TableCell>
                      <TableCell align="right">
                        {history.success_count} / {history.error_count}
                      </TableCell>
                      <TableCell>{history.user?.name ?? "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={IMPORT_STATUS_LABEL[history.status]}
                          size="small"
                          color={IMPORT_STATUS_COLOR[history.status]}
                          variant="outlined"
                        />
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
