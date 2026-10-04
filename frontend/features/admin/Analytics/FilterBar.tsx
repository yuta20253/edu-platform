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

// 入力途中のInvalid Dateをフィルタへ反映しないよう、確定した値のみ通す
// （ImportHistory と同じ扱い）。
const isCommittedDate = (date: Date | null) => !date || isValid(date);

const compactFieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "2px", fontSize: "0.8125rem" },
  "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
};

export const FilterBar = ({
  filters,
  highSchoolOptions,
  subjectOptions,
  validationErrors,
  onChange,
}: Props) => {
  const preset = detectPreset(filters);
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
        <Stack direction="row" spacing={1}>
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
          <DatePicker
            label="開始日"
            format="yyyy/MM/dd"
            value={fromDate}
            maxDate={toDate ?? undefined}
            onChange={(date) => {
              if (isCommittedDate(date)) onChange({ from: dateToParam(date) });
            }}
            slotProps={{
              textField: {
                size: "small",
                sx: { width: 180, ...compactFieldSx },
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
              if (isCommittedDate(date)) onChange({ to: dateToParam(date) });
            }}
            slotProps={{
              textField: {
                size: "small",
                error: dateRangeInvalid,
                helperText: dateRangeInvalid
                  ? "終了日は開始日以降の日付を指定してください"
                  : undefined,
                sx: { width: 180, ...compactFieldSx },
              },
              field: { clearable: true },
            }}
          />
        </LocalizationProvider>

        <FormControl size="small" sx={{ minWidth: 160, ...compactFieldSx }}>
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

        <FormControl size="small" sx={{ minWidth: 140, ...compactFieldSx }}>
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
          {validationErrors.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </Alert>
      )}
    </Box>
  );
};
