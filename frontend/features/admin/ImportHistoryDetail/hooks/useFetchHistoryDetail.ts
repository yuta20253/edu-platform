"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type {
  DetailTabValue,
  ImportHistoryDetailData,
  SnackbarState,
} from "../types";

const INITIAL_SNACKBAR: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

// Content-Disposition から filename を取り出す。
// RFC5987 形式（filename*=UTF-8''...）と素の filename の両方に対応する。
const extractFileName = (contentDisposition: string | undefined) => {
  if (!contentDisposition) return null;

  const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      // 不正なエスケープが含まれる場合はフォールバックへ委ねる
    }
  }

  const plain = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : null;
};

export const useFetchHistoryDetail = (historyId: number) => {
  const [data, setData] = useState<ImportHistoryDetailData | null>(null);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTabValue>("errors");
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>(INITIAL_SNACKBAR);
  const router = useRouter();

  useEffect(() => {
    // 履歴を素早く切り替えた際、古いリクエストのレスポンスが新しい
    // レスポンスを上書きしないよう、リクエストごとにキャンセルする
    const controller = new AbortController();

    // 履歴の切り替え中に前の履歴の内容が表示され続けないよう、
    // 取得開始時点で一旦クリアする
    setData(null);
    setError(false);
    apiClient
      .get<ImportHistoryDetailData>(
        `/api/admin/import_histories/${historyId}`,
        {
          signal: controller.signal,
        },
      )
      .then((res) => setData(res.data))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError(true);
      });

    return () => {
      controller.abort();
    };
  }, [historyId, router]);

  const handleExport = async () => {
    setExporting(true);

    try {
      const res = await apiClient.get(
        `/api/admin/import_histories/${historyId}/export`,
        { responseType: "blob" },
      );

      const fileName =
        extractFileName(res.headers?.["content-disposition"]) ??
        `import_history_${historyId}.csv`;

      const url = URL.createObjectURL(res.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      const { status } = extractApiError(err);
      if (status === 401) {
        router.push("/login");
        return;
      }
      setSnackbar({
        open: true,
        message: "CSVのダウンロードに失敗しました",
        severity: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return {
    data,
    error,
    activeTab,
    exporting,
    snackbar,
    onTabChange: setActiveTab,
    onExport: handleExport,
    onSnackbarClose: handleSnackbarClose,
  };
};
