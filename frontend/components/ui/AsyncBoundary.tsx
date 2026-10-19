"use client";

import type { ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";
import { ErrorState } from "./ErrorState";

type Props<T> = {
  data: T | null | undefined;
  error?: boolean | Error | null;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
};

// データ取得画面の表示分岐(エラー → ローディング → 成功)を共通化する。
export const AsyncBoundary = <T,>({
  data,
  error,
  onRetry,
  children,
}: Props<T>) => {
  if (error) {
    return <ErrorState onRetry={onRetry} />;
  }

  // data も error もない状態をローディングとみなす(loading フラグに依存しない)。
  // 0 や [] は有効な data なので、null / undefined だけで判定する。
  if (data === null || data === undefined) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 240,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children(data)}</>;
};
