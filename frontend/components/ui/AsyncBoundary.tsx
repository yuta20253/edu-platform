"use client";

import type { ReactNode } from "react";
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

  return <>{children(data as T)}</>;
};
