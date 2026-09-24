"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { SchoolClassDetailType } from "../types";

export const useSchoolClass = (schoolClassId: number) => {
  const [schoolClass, setSchoolClass] = useState<SchoolClassDetailType | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // クラスを素早く切り替えた際、古いリクエストの応答が後から返ってきて
    // 新しい表示を上書きしないようキャンセルする
    const controller = new AbortController();

    setLoading(true);
    setError(false);

    apiClient
      .get<SchoolClassDetailType>(
        `/api/teacher/school-classes/${schoolClassId}`,
        { signal: controller.signal },
      )
      .then((res) => setSchoolClass(res.data))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
        setSchoolClass(null);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [router, schoolClassId]);

  return { schoolClass, loading, error };
};
