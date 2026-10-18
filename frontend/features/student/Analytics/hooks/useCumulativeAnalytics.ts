"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GradeAverageData, UnderstandingScoreData } from "../types";

const fetchAnalytics = <T>(type: "grade_average" | "understanding_score") =>
  apiClient
    .get<T>("/api/student/analytics", { params: { type } })
    .then((res) => res.data);

const isUnauthorized = (result: PromiseSettledResult<unknown>) =>
  result.status === "rejected" && result.reason?.response?.status === 401;

// 学年平均・理解度はバックエンドが期間を受け取らない累計の集計なので、
// 期間チップとは連動させず、画面を開いたときに1回だけ取得する
export const useCumulativeAnalytics = () => {
  const [gradeAverage, setGradeAverage] = useState<GradeAverageData | null>(
    null,
  );
  const [understandingScore, setUnderstandingScore] =
    useState<UnderstandingScoreData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      fetchAnalytics<GradeAverageData>("grade_average"),
      fetchAnalytics<UnderstandingScoreData>("understanding_score"),
    ]).then(([gradeAverageResult, understandingScoreResult]) => {
      if (!active) return;
      if (
        isUnauthorized(gradeAverageResult) ||
        isUnauthorized(understandingScoreResult)
      ) {
        router.push("/login");
        return;
      }

      // 片方が失敗しても、取得できた方は表示する(失敗した方は null のまま)
      if (gradeAverageResult.status === "fulfilled") {
        setGradeAverage(gradeAverageResult.value);
      }
      if (understandingScoreResult.status === "fulfilled") {
        setUnderstandingScore(understandingScoreResult.value);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  return { gradeAverage, understandingScore, loading };
};
