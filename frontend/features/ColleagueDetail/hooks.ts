"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Teacher } from "./types";

export const useColleagueDetail = (colleagueId: number) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(null);

    apiClient
      .get<Teacher>(`/api/teacher/colleagues/${colleagueId}`)
      .then((res) => setTeacher(res.data))
      .catch((err) => {
        const status = err.response?.status;

        if (status === 401) {
          router.push("/login");
          return;
        }

        setError(status ?? 500);
        setTeacher(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [colleagueId, router]);

  return { teacher, loading, error };
};
