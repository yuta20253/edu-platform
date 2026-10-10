"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/components/ui/ToastProvider";
import { apiClient } from "@/libs/http/apiClient";
import { Presenter } from "./Presenter";
import type { SchoolsData } from "./types";
import { Prefecture } from "@/types/common/prefecture";

export const Schools = () => {
  const [data, setData] = useState<SchoolsData | null>(null);
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [selectedPrefectureId, setSelectedPrefectureId] = useState<
    number | null
  >(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const params: Record<string, string> = { page: String(page) };
    if (selectedPrefectureId !== null) {
      params.prefecture_id = String(selectedPrefectureId);
    }

    setError(false);
    apiClient
      .get<SchoolsData>("/api/admin/schools", { params })
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      });
  }, [page, selectedPrefectureId, router, reloadKey]);

  useEffect(() => {
    apiClient
      .get<Prefecture[]>("/api/auth/prefectures")
      .then((res) => setPrefectures(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        toast.show({
          message: "都道府県の取得に失敗しました",
          severity: "error",
        });
      });
    // toast は安定した参照のため依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handlePrefectureChange = (id: number | null) => {
    setSelectedPrefectureId(id);
    setPage(1);
  };

  if (!data) {
    if (error) {
      return <ErrorState onRetry={() => setReloadKey((prev) => prev + 1)} />;
    }

    return (
      <Box sx={{ p: 3 }}>
        <CardSkeleton lines={5} />
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
};
