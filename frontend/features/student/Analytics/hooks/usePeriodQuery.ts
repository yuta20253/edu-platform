"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  AnalyticsPeriod,
  periodFromSearchParams,
  periodToSearchParams,
} from "../period";

// 期間の正はURLクエリ。リロード・共有しても同じ期間で表示される
export const usePeriodQuery = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryKey = searchParams.toString();
  const period = useMemo(
    () => periodFromSearchParams(new URLSearchParams(queryKey)),
    [queryKey],
  );

  const setPeriod = useCallback(
    (next: AnalyticsPeriod) => {
      const query = periodToSearchParams(next).toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router],
  );

  return { period, setPeriod };
};
