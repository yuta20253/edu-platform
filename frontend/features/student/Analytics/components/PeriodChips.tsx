"use client";

import { Alert, Box, Chip, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { tokyoTodayAsLocalDate } from "@/libs/date/tokyoDate";
import {
  AnalyticsPeriod,
  DEFAULT_PRESET,
  PERIOD_PRESETS,
  detectPreset,
  isDefaultPeriod,
  presetRange,
} from "../period";

type Props = {
  period: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
  // 期間不正(422)のメッセージ。画面全体をエラーにせず、チップの直下に出す
  validationErrors: string[];
};

export const PeriodChips = ({ period, onChange, validationErrors }: Props) => {
  // 「今日」は描画した時刻で決まり、サーバー描画と日付をまたぐとハイドレーション
  // 不一致になる。日付を指定したときのプリセットの選択状態はマウント後に決める
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setToday(tokyoTodayAsLocalDate());
  }, []);
  // 未指定なら今日に関係なく既定の期間なので、サーバー描画の時点から選択状態にする
  const preset = isDefaultPeriod(period)
    ? DEFAULT_PRESET
    : today
      ? detectPreset(period, today)
      : null;

  return (
    <Box>
      <Stack direction="row" spacing={1}>
        {PERIOD_PRESETS.map((days) => (
          <Chip
            key={days}
            label={`${days}日間`}
            clickable
            aria-pressed={preset === days}
            color={preset === days ? "primary" : "default"}
            variant={preset === days ? "filled" : "outlined"}
            onClick={() => {
              // 選択状態の判定と同じ today を使い、日付をまたいでもずれないようにする
              if (preset !== days)
                onChange(presetRange(days, today ?? tokyoTodayAsLocalDate()));
            }}
            sx={{ fontWeight: 700 }}
          />
        ))}
      </Stack>

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
