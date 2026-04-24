"use client";

import { apiClient } from "@/libs/http/apiClient";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { TeachersData } from "./types";

export const useColleagues = () => {
  const [data, setData] = useState<TeachersData | null>(null);
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    apiClient
      .get<TeachersData>("/api/teacher/colleagues")
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [router]);

  return { data, page, setPage };
};
