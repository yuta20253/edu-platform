"use client";

import { Alert, Box, Chip, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import {
  AnalyticsPeriod,
  PERIOD_PRESETS,
  detectPreset,
  presetRange,
} from "../period";

type Props = {
  period: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
  // 期間不正(422)のメッセージ。画面全体をエラーにせず、チップの直下に出す
  validationErrors: string[];
};

export const PeriodChips = ({ period, onChange, validationErrors }: Props) => {
  // 「今日」はブラウザの日付で決まり、サーバー描画(UTC)とずれるとハイドレーション
  // 不一致になる。プリセットの選択状態はマウント後に決める
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setToday(new Date());
  }, []);
  const preset = today ? detectPreset(period, today) : null;

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
              if (preset !== days) onChange(presetRange(days));
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
