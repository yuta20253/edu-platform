"use client";

import { colors } from "@/app/theme/colors";
import {
  Alert,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { jaJP } from "@mui/x-date-pickers/locales";
import { isValid } from "date-fns";
import { ja } from "date-fns/locale";
import { useEffect, useState } from "react";
import { dateToInput, dateToParam } from "../ImportHistory/dateUtils";
import { detectPreset, presetRange } from "./filters";
import {
  PERIOD_PRESETS,
  type AnalyticsFilters,
  type HighSchoolOption,
  type SubjectOption,
} from "./types";

type Props = {
  filters: AnalyticsFilters;
  highSchoolOptions: HighSchoolOption[];
  subjectOptions: SubjectOption[];
  // 期間不正(422)などのメッセージ。フィルタ直下に出し、全画面エラーにはしない。
  validationErrors: string[];
  onChange: (patch: Partial<AnalyticsFilters>) => void;
};

// 入力途中の日付をフィルタへ反映しないよう、確定した値のみ通す。
// - Invalid Date（ImportHistory と同じ）
// - 年を「2026」と打つ途中にできる「0020年」「0202年」のような不完全な年。
//   反映すると366日超の期間として 422 が一瞬表示され、無駄な取得も走る。
const MIN_COMMITTED_YEAR = 1000;
const isCommittedDate = (date: Date | null) =>
  !date || (isValid(date) && date.getFullYear() >= MIN_COMMITTED_YEAR);

const compactFieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "2px", fontSize: "0.8125rem" },
  "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
};

type DateFieldProps = {
  label: string;
  // URL クエリ由来の確定値（yyyy-MM-dd。未指定は空文字）
  value: string;
  minDate?: Date;
  maxDate?: Date;
  error?: boolean;
  helperText?: string;
  onCommit: (value: string) => void;
};

// 入力欄が編集中の値を保てるよう、表示用の下書きをローカルで持つ。
// 確定していない値(isCommittedDate でないもの)は onCommit に渡さない。
// 下書きを持たず親の値だけで制御すると、不完全な年を握りつぶした時点で
// 入力欄が元の値に戻され、打ち直しができなくなる。
const DateField = ({
  label,
  value,
  minDate,
  maxDate,
  error,
  helperText,
  onCommit,
}: DateFieldProps) => {
  const [draft, setDraft] = useState<Date | null>(dateToInput(value));

  useEffect(() => {
    setDraft(dateToInput(value));
  }, [value]);

  return (
    <DatePicker
      label={label}
      format="yyyy/MM/dd"
      value={draft}
      minDate={minDate}
      maxDate={maxDate}
      onChange={(date) => {
        setDraft(date);
        if (isCommittedDate(date)) onCommit(dateToParam(date));
      }}
      slotProps={{
        textField: {
          size: "small",
          error,
          helperText,
          sx: { width: { xs: "100%", sm: 180 }, ...compactFieldSx },
        },
        field: { clearable: true },
      }}
    />
  );
};

export const FilterBar = ({
  filters,
  highSchoolOptions,
  subjectOptions,
  validationErrors,
  onChange,
}: Props) => {
  // 「今日」はブラウザの日付で決まり、サーバー描画(UTC)とずれるとハイドレーション
  // 不一致になる。プリセットの選択状態はマウント後に決める。
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setToday(new Date());
  }, []);
  const preset = today ? detectPreset(filters, today) : null;
  const fromDate = dateToInput(filters.from);
  const toDate = dateToInput(filters.to);
  const dateRangeInvalid = !!fromDate && !!toDate && fromDate > toDate;

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          bgcolor: colors.surface.default,
          border: `1px solid ${colors.border.light}`,
        }}
      >
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
          {PERIOD_PRESETS.map((days) => (
            <Chip
              key={days}
              label={`過去${days}日`}
              clickable
              size="small"
              aria-pressed={preset === days}
              color={preset === days ? "primary" : "default"}
              variant={preset === days ? "filled" : "outlined"}
              onClick={() => onChange(presetRange(days))}
            />
          ))}
        </Stack>

        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={ja}
          localeText={
            jaJP.components.MuiLocalizationProvider.defaultProps.localeText
          }
        >
          <DateField
            label="開始日"
            value={filters.from}
            maxDate={toDate ?? undefined}
            onCommit={(from) => onChange({ from })}
          />
          <DateField
            label="終了日"
            value={filters.to}
            minDate={fromDate ?? undefined}
            error={dateRangeInvalid}
            helperText={
              dateRangeInvalid
                ? "終了日は開始日以降の日付を指定してください"
                : undefined
            }
            onCommit={(to) => onChange({ to })}
          />
        </LocalizationProvider>

        <FormControl
          size="small"
          sx={{ minWidth: { xs: "100%", sm: 160 }, ...compactFieldSx }}
        >
          <InputLabel id="analytics-high-school-label">高校</InputLabel>
          <Select
            labelId="analytics-high-school-label"
            label="高校"
            value={filters.highSchoolId}
            onChange={(e) => onChange({ highSchoolId: String(e.target.value) })}
          >
            <MenuItem value="">すべて</MenuItem>
            {highSchoolOptions.map((school) => (
              <MenuItem key={school.id} value={String(school.id)}>
                {school.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          size="small"
          sx={{ minWidth: { xs: "100%", sm: 140 }, ...compactFieldSx }}
        >
          <InputLabel id="analytics-subject-label">科目</InputLabel>
          <Select
            labelId="analytics-subject-label"
            label="科目"
            value={filters.subjectId}
            onChange={(e) => onChange({ subjectId: String(e.target.value) })}
          >
            <MenuItem value="">すべて</MenuItem>
            {subjectOptions.map((subject) => (
              <MenuItem key={subject.id} value={String(subject.id)}>
                {subject.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {validationErrors.map((message, index) => (
            <div key={`${index}-${message}`}>{message}</div>
          ))}
        </Alert>
      )}
    </Box>
  );
};
