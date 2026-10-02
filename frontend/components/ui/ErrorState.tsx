"use client";

import { Alert, Box, Button } from "@mui/material";

type Props = {
  message?: string;
  // 渡した場合のみ再試行ボタンを表示する。20箇所ある表示のうち
  // 再試行ボタンがあるのはAdminDetailの1箇所だけだったため必須にしない。
  onRetry?: () => void;
};

// 一覧・詳細のデータ取得エラー表示。非401エラーを握りつぶして
// 無限スピナーになる箇所や、ハードコードされたエラー文言の
// バラバラな見た目を共通化する。
export const ErrorState = ({
  message = "データの取得に失敗しました",
  onRetry,
}: Props) => (
  <Box sx={{ p: 3 }}>
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            再試行
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  </Box>
);
