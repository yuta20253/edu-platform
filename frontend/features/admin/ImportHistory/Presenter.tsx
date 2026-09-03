"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { jaJP } from "@mui/x-date-pickers/locales";
import { ja } from "date-fns/locale";
import {
  IMPORT_STATUS_COLOR,
  IMPORT_STATUS_LABEL,
  PER_PAGE_OPTIONS,
  type CourseOption,
  type ImportHistoriesData,
  type ImportHistoryFilters,
  type ImportHistoryOrder,
  type ImportHistorySort,
  type ImportHistoryStatus,
  type UnitOption,
  type UserOption,
} from "./types";
import { isValid } from "date-fns";
import { dateToInput, dateToParam, formatDateTime } from "./dateUtils";

// DatePickerは日付欄が入力途中の間、"01"を入力しようとして"0"だけ打った瞬間
// のように、まだ確定していないInvalid Dateをonchangeへ渡してくることがある。
// これをそのままフィルタへ反映すると、入力中に無効な状態が確定してしまい
// 検索が実行された上に日付欄の表示も乱れるため、確定した値(null または
// 有効なDate)のときだけ反映する。
const isCommittedDate = (date: Date | null) => !date || isValid(date);

type Props = {
  data: ImportHistoriesData;
  filters: ImportHistoryFilters;
  courseOptions: CourseOption[];
  unitOptions: UnitOption[];
  userOptions: UserOption[];
  sort: ImportHistorySort;
  order: ImportHistoryOrder;
  page: number;
  perPage: number;
  onStatusChange: (status: ImportHistoryStatus | "") => void;
  onCourseChange: (courseId: string) => void;
  onUnitChange: (unitId: string) => void;
  onUserChange: (userId: string) => void;
  onFromChange: (from: string) => void;
  onToChange: (to: string) => void;
  onSortChange: (sort: ImportHistorySort) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: string) => void;
  onClearFilters: () => void;
  onRowClick: (id: number) => void;
};

const STATUS_OPTIONS: { value: ImportHistoryStatus; label: string }[] = [
  { value: "pending", label: IMPORT_STATUS_LABEL.pending },
  { value: "processing", label: IMPORT_STATUS_LABEL.processing },
  { value: "completed", label: IMPORT_STATUS_LABEL.completed },
  { value: "failed", label: IMPORT_STATUS_LABEL.failed },
];

// Gentelella風のフラット・ミニマルなテイストを本画面ローカルで再現するトークン。
// 角丸なし・影なし、薄いグレーのボーダーのみで区切る。
const flat = {
  border: "#E6E9ED",
  headerBg: "#ffffff",
  stripe: "#F7F7F7",
  accent: "#1ABB9C",
  titleText: "#2A3F54",
  filterBg: "#FAFBFC",
};

// フィルタのSelect/DatePickerを角丸なし・小さめのGentelella風に揃えるための共通sx
const compactFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "2px",
    fontSize: "0.8125rem",
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.8125rem",
  },
};

export const Presenter = ({
  data,
  filters,
  courseOptions,
  unitOptions,
  userOptions,
  sort,
  order,
  page,
  perPage,
  onStatusChange,
  onCourseChange,
  onUnitChange,
  onUserChange,
  onFromChange,
  onToChange,
  onSortChange,
  onPageChange,
  onPerPageChange,
  onClearFilters,
  onRowClick,
}: Props) => {
  const { import_histories: histories, meta } = data;

  const fromDate = dateToInput(filters.from);
  const toDate = dateToInput(filters.to);
  const dateRangeInvalid = !!fromDate && !!toDate && fromDate > toDate;
  const hasActiveFilters =
    !!filters.status ||
    !!filters.courseId ||
    !!filters.unitId ||
    !!filters.userId ||
    !!filters.from ||
    !!filters.to;

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          gap: 1.5,
          mb: 3,
          pb: 1.5,
          borderBottom: `2px solid ${flat.border}`,
        }}
      >
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ color: flat.titleText, letterSpacing: 0.3 }}
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
          gap: 1.25,
          mb: 3,
          p: 1.5,
          bgcolor: flat.filterBg,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 110, ...compactFieldSx }}>
          <InputLabel id="import-history-status-label">ステータス</InputLabel>
          <Select
            labelId="import-history-status-label"
            label="ステータス"
            value={filters.status}
            onChange={(e) =>
              onStatusChange(e.target.value as ImportHistoryStatus | "")
            }
            endAdornment={
              filters.status && (
                <InputAdornment position="end" sx={{ mr: 2 }}>
                  <IconButton
                    aria-label="ステータスをクリア"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange("");
                    }}
                  >
                    <ClearIcon fontSize="inherit" />
                  </IconButton>
                </InputAdornment>
              )
            }
          >
            <MenuItem value="">すべて</MenuItem>
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130, ...compactFieldSx }}>
          <InputLabel id="import-history-course-label">コース</InputLabel>
          <Select
            labelId="import-history-course-label"
            label="コース"
            value={filters.courseId}
            onChange={(e) => onCourseChange(e.target.value)}
            endAdornment={
              filters.courseId && (
                <InputAdornment position="end" sx={{ mr: 2 }}>
                  <IconButton
                    aria-label="コースをクリア"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCourseChange("");
                    }}
                  >
                    <ClearIcon fontSize="inherit" />
                  </IconButton>
                </InputAdornment>
              )
            }
          >
            <MenuItem value="">すべて</MenuItem>
            {courseOptions.map((course) => (
              <MenuItem key={course.id} value={String(course.id)}>
                {course.level_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130, ...compactFieldSx }}>
          <InputLabel id="import-history-unit-label">単元</InputLabel>
          <Select
            labelId="import-history-unit-label"
            label="単元"
            value={filters.unitId}
            onChange={(e) => onUnitChange(e.target.value)}
            endAdornment={
              filters.unitId && (
                <InputAdornment position="end" sx={{ mr: 2 }}>
                  <IconButton
                    aria-label="単元をクリア"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnitChange("");
                    }}
                  >
                    <ClearIcon fontSize="inherit" />
                  </IconButton>
                </InputAdornment>
              )
            }
          >
            <MenuItem value="">すべて</MenuItem>
            {unitOptions.map((unit) => (
              <MenuItem key={unit.id} value={String(unit.id)}>
                {unit.unit_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130, ...compactFieldSx }}>
          <InputLabel id="import-history-user-label">実行者</InputLabel>
          <Select
            labelId="import-history-user-label"
            label="実行者"
            value={filters.userId}
            onChange={(e) => onUserChange(e.target.value)}
            endAdornment={
              filters.userId && (
                <InputAdornment position="end" sx={{ mr: 2 }}>
                  <IconButton
                    aria-label="実行者をクリア"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUserChange("");
                    }}
                  >
                    <ClearIcon fontSize="inherit" />
                  </IconButton>
                </InputAdornment>
              )
            }
          >
            <MenuItem value="">すべて</MenuItem>
            {userOptions.map((user) => (
              <MenuItem key={user.id} value={String(user.id)}>
                {user.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={ja}
          localeText={
            jaJP.components.MuiLocalizationProvider.defaultProps.localeText
          }
        >
          <DatePicker
            label="開始日"
            format="yyyy/MM/dd"
            value={fromDate}
            maxDate={toDate ?? undefined}
            onChange={(date) => {
              if (isCommittedDate(date)) onFromChange(dateToParam(date));
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: { width: 220, ...compactFieldSx },
              },
              field: { clearable: true },
            }}
          />
          <DatePicker
            label="終了日"
            format="yyyy/MM/dd"
            value={toDate}
            minDate={fromDate ?? undefined}
            onChange={(date) => {
              if (isCommittedDate(date)) onToChange(dateToParam(date));
            }}
            slotProps={{
              textField: {
                size: "small",
                error: dateRangeInvalid,
                helperText: dateRangeInvalid
                  ? "終了日は開始日以降の日付を指定してください"
                  : undefined,
                sx: { width: 220, ...compactFieldSx },
              },
              field: { clearable: true },
            }}
          />
        </LocalizationProvider>

        {hasActiveFilters && (
          <Button
            size="small"
            onClick={onClearFilters}
            sx={{
              color: colors.text.muted,
              textTransform: "none",
              fontSize: "0.8125rem",
            }}
          >
            フィルタを全てクリア
          </Button>
        )}

        <FormControl
          size="small"
          sx={{ minWidth: 90, ml: "auto", ...compactFieldSx }}
        >
          <InputLabel id="import-history-per-page-label">表示件数</InputLabel>
          <Select
            labelId="import-history-per-page-label"
            label="表示件数"
            value={String(perPage)}
            onChange={(e) => onPerPageChange(e.target.value)}
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
          border: `1px solid ${flat.border}`,
          borderRadius: 0,
          boxShadow: "none",
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
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    borderBottom: `1px solid ${flat.border}`,
                  },
                }}
              >
                <TableHead>
                  <TableRow sx={{ bgcolor: flat.headerBg }}>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        borderBottom: `2px solid ${flat.border}`,
                      }}
                    >
                      <TableSortLabel
                        active={sort === "created_at"}
                        direction={sort === "created_at" ? order : "desc"}
                        onClick={() => onSortChange("created_at")}
                      >
                        日時
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        borderBottom: `2px solid ${flat.border}`,
                      }}
                    >
                      コース
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        borderBottom: `2px solid ${flat.border}`,
                      }}
                    >
                      単元
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        borderBottom: `2px solid ${flat.border}`,
                      }}
                      align="right"
                    >
                      <TableSortLabel
                        active={sort === "total_count"}
                        direction={sort === "total_count" ? order : "asc"}
                        onClick={() => onSortChange("total_count")}
                      >
                        件数
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        borderBottom: `2px solid ${flat.border}`,
                      }}
                      align="right"
                    >
                      <TableSortLabel
                        active={sort === "success_count"}
                        direction={sort === "success_count" ? order : "asc"}
                        onClick={() => onSortChange("success_count")}
                      >
                        成功数
                      </TableSortLabel>
                      {" / "}
                      <TableSortLabel
                        active={sort === "error_count"}
                        direction={sort === "error_count" ? order : "asc"}
                        onClick={() => onSortChange("error_count")}
                      >
                        エラー数
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        borderBottom: `2px solid ${flat.border}`,
                      }}
                    >
                      実行者
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        borderBottom: `2px solid ${flat.border}`,
                      }}
                    >
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
                  {histories.map((history, index) => (
                    <TableRow
                      key={history.id}
                      hover
                      onClick={() => onRowClick(history.id)}
                      sx={{
                        cursor: "pointer",
                        bgcolor: index % 2 === 1 ? flat.stripe : "transparent",
                        "&:last-child td": { border: 0 },
                        "&:hover": { bgcolor: "#EFF3F5" },
                      }}
                    >
                      <TableCell>
                        {formatDateTime(history.created_at)}
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
                          variant="filled"
                          sx={{
                            borderRadius: "3px",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            color: "#fff",
                          }}
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
