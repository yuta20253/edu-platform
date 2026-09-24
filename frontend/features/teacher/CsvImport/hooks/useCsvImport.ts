"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type {
  CsvImportState,
  DryRunResult,
  ImportAcceptedResult,
  WizardStep,
} from "../types";

const ALLOWED_EXTENSION = ".csv";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const validateFile = (file: File): string | null => {
  if (!file.name.toLowerCase().endsWith(ALLOWED_EXTENSION)) {
    return "CSVファイル（.csv）のみアップロード可能です";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "ファイルサイズは5MB以内にしてください";
  }
  return null;
};

const initialState: CsvImportState = {
  step: 1,
  file: null,
  fileError: null,
  dryRunLoading: false,
  dryRunResult: null,
  dryRunError: null,
  submitting: false,
  submitError: null,
  importResult: null,
};

export const useCsvImport = () => {
  const router = useRouter();
  const [state, setState] = useState<CsvImportState>(initialState);
  const dryRunControllerRef = useRef<AbortController | null>(null);

  // 実行中のドライランをキャンセルする。ファイルを差し替えた後に古いファイルの
  // 検証結果が反映され、プレビューと実際のインポート対象がずれるのを防ぐ
  const cancelDryRun = () => {
    dryRunControllerRef.current?.abort();
    dryRunControllerRef.current = null;
  };

  useEffect(() => {
    return () => {
      cancelDryRun();
    };
  }, []);

  const handleFileSelect = (file: File) => {
    cancelDryRun();
    const error = validateFile(file);
    setState((prev) => ({
      ...prev,
      file: error ? null : file,
      fileError: error,
      dryRunLoading: false,
      dryRunResult: null,
      dryRunError: null,
    }));
  };

  const handleFileClear = () => {
    cancelDryRun();
    setState((prev) => ({
      ...prev,
      file: null,
      fileError: null,
      dryRunLoading: false,
      dryRunResult: null,
      dryRunError: null,
    }));
  };

  const runDryRun = async () => {
    if (!state.file) {
      setState((prev) => ({
        ...prev,
        fileError: "CSVファイルを選択してください",
      }));
      return;
    }
    setState((prev) => ({ ...prev, dryRunLoading: true, dryRunError: null }));

    const formData = new FormData();
    formData.append("file", state.file);

    cancelDryRun();
    const controller = new AbortController();
    dryRunControllerRef.current = controller;

    try {
      const res = await apiClient.post<DryRunResult>(
        "/api/teacher/import_students/dry_run",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          signal: controller.signal,
        },
      );
      setState((prev) => ({
        ...prev,
        dryRunResult: res.data,
        dryRunLoading: false,
        step: 2,
      }));
    } catch (err) {
      if (axios.isCancel(err)) return;
      const { status, errors } = extractApiError(err);
      if (status === 401) {
        router.push("/login");
        return;
      }
      setState((prev) => ({
        ...prev,
        dryRunLoading: false,
        dryRunError: errors?.[0] ?? "CSVの検証に失敗しました",
        step: 2,
      }));
    }
  };

  const submitImport = async () => {
    if (!state.file) {
      setState((prev) => ({
        ...prev,
        submitError: "CSVファイルを選択してください",
      }));
      return;
    }
    setState((prev) => ({ ...prev, submitting: true, submitError: null }));

    const formData = new FormData();
    formData.append("file", state.file);

    try {
      const res = await apiClient.post<ImportAcceptedResult>(
        "/api/teacher/import_students",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setState((prev) => ({
        ...prev,
        submitting: false,
        importResult: res.data,
        step: 4,
      }));
    } catch (err) {
      const { status, errors } = extractApiError(err);
      if (status === 401) {
        router.push("/login");
        return;
      }
      setState((prev) => ({
        ...prev,
        submitting: false,
        submitError: errors?.[0] ?? "インポートの実行に失敗しました",
      }));
    }
  };

  const goNext = async () => {
    if (state.step === 1) {
      await runDryRun();
      return;
    }
    if (state.step === 2) {
      if (!state.dryRunResult || state.dryRunResult.rows.length > 0) return;
      setState((prev) => ({ ...prev, step: 3 }));
      return;
    }
    if (state.step === 3) {
      await submitImport();
    }
  };

  const goBack = () => {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1) as WizardStep,
    }));
  };

  const resetForNewImport = () => {
    cancelDryRun();
    setState(initialState);
  };

  return {
    state,
    handleFileSelect,
    handleFileClear,
    goNext,
    goBack,
    resetForNewImport,
  };
};
