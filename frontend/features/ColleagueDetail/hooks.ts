"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Teacher } from "./types";

export const useColleagueDetail = (colleagueId: number) => {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<Teacher>(`/api/teacher/colleagues/${colleagueId}`)
      .then((res) => setTeacher(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [colleagueId, router]);

  return { teacher };
};
