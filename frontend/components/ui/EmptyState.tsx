"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  message: string;
  // メッセージの下に置く任意のCTA（再試行ボタンなど）
  action?: ReactNode;
  // 上下のpadding。一覧の空状態は6、フィールド単位の空値表示など
  // 狭い場所で使う場合は4を渡す。
  py?: number;
};

// 一覧が0件のときの共通表示。「〜が見つかりません」等の文言・paddingが
// 画面ごとにバラバラだったため切り出した。
export const EmptyState = ({ message, action, py = 6 }: Props) => (
  <Box data-testid="empty-state" sx={{ py, textAlign: "center" }}>
    <Typography color="text.secondary" sx={action ? { mb: 2 } : undefined}>
      {message}
    </Typography>
    {action}
  </Box>
);
