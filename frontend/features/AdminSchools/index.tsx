"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { apiClient } from "@/libs/http/apiClient";
import { Presenter } from "./Presenter";
import type { AdminSchoolsData } from "./types";

type Prefecture = {
  id: number;
  name: string;
};

export function AdminSchools() {
  const [data, setData] = useState<AdminSchoolsData | null>(null);
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [selectedPrefectureId, setSelectedPrefectureId] = useState<
    number | null
  >(null);
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const params: Record<string, string> = { page: String(page) };
    if (selectedPrefectureId !== null) {
      params.prefecture_id = String(selectedPrefectureId);
    }

    apiClient
      .get<AdminSchoolsData>("/api/admin/schools", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
        }
      });
  }, [page, selectedPrefectureId, router]);

  useEffect(() => {
    apiClient
      .get<Prefecture[]>("/api/auth/prefectures")
      .then((res) => setPrefectures(res.data))
      .catch(() => {});
  }, []);

  const handlePrefectureChange = (id: number | null) => {
    setSelectedPrefectureId(id);
    setPage(1);
  };

  if (!data) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Presenter
      data={data}
      prefectures={prefectures}
      selectedPrefectureId={selectedPrefectureId}
      page={page}
      onPrefectureChange={handlePrefectureChange}
      onPageChange={setPage}
    />
  );
}
