"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "./ErrorState";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

// error.tsx から呼ぶ共通のエラー表示。Server Component の例外は reset() だけでは
// 再取得されないため、router.refresh() と合わせて呼ぶ。
// 本番では error.message が伏せられるので、文言は ErrorState の初期値を使う。
export const RouteError = ({ reset }: Props): React.JSX.Element => {
  const router = useRouter();

  return (
    <ErrorState
      onRetry={() =>
        startTransition(() => {
          router.refresh();
          reset();
        })
      }
    />
  );
};
