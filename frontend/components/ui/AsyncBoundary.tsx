"use client";

import type { ReactElement, ReactNode } from "react";
import { Box, CircularProgress, Table } from "@mui/material";
import { CardSkeleton } from "./CardSkeleton";
import { ErrorState } from "./ErrorState";
import { TableSkeleton } from "./TableSkeleton";

type Fallback = "spinner" | "card-skeleton" | "table-skeleton";

type SkeletonProps = {
  // table-skeleton
  rows?: number;
  columns?: number;
  // card-skeleton
  lines?: number;
};

type Props<T> = {
  data: T | null | undefined;
  error?: boolean | Error | null;
  onRetry?: () => void;
  // エラー表示のメッセージ。省略時は ErrorState のデフォルト文言。
  errorMessage?: string;
  // ローディング表示。種類(デフォルトはスピナー)か、画面固有のスケルトン要素を渡す。
  fallback?: Fallback | ReactElement;
  skeletonProps?: SkeletonProps;
  children: (data: T) => ReactNode;
};

const Loading = ({
  fallback,
  skeletonProps,
}: {
  fallback: Fallback | ReactElement;
  skeletonProps?: SkeletonProps;
}) => {
  if (typeof fallback === "object") {
    return fallback;
  }

  if (fallback === "card-skeleton") {
    return <CardSkeleton lines={skeletonProps?.lines} />;
  }

  if (fallback === "table-skeleton") {
    return (
      <Table>
        <TableSkeleton
          rows={skeletonProps?.rows}
          columns={skeletonProps?.columns}
        />
      </Table>
    );
  }

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
};

// データ取得画面の表示分岐(エラー → ローディング → 成功)を共通化する。
export const AsyncBoundary = <T,>({
  data,
  error,
  onRetry,
  errorMessage,
  fallback = "spinner",
  skeletonProps,
  children,
}: Props<T>) => {
  if (error) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  // data も error もない状態をローディングとみなす(loading フラグに依存しない)。
  // 0 や [] は有効な data なので、null / undefined だけで判定する。
  if (data === null || data === undefined) {
    return <Loading fallback={fallback} skeletonProps={skeletonProps} />;
  }

  return <>{children(data)}</>;
};
