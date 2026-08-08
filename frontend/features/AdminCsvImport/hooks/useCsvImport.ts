"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type {
  CsvImportState,
  DryRunResult,
  ImportAcceptedResult,
  ImportMode,
  WizardStep,
} from "../types";

type UseCsvImportParams = {
  presetCourseId: number | null;
  presetUnitId: number | null;
};

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

export const useCsvImport = ({
  presetCourseId,
  presetUnitId,
}: UseCsvImportParams) => {
  const router = useRouter();
  const [state, setState] = useState<CsvImportState>(() => ({
    step: 1,
    courseId: presetCourseId,
    unitId: presetUnitId,
    isPreset: presetCourseId != null && presetUnitId != null,
    file: null,
    fileError: null,
    mode: "append",
    dryRunLoading: false,
    dryRunResult: null,
    dryRunError: null,
    submitting: false,
    submitError: null,
    importResult: null,
  }));

  const handleCourseChange = (courseId: number) => {
    setState((prev) => ({ ...prev, courseId, unitId: null }));
  };

  const handleUnitChange = (unitId: number) => {
    setState((prev) => ({ ...prev, unitId }));
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    setState((prev) => ({
      ...prev,
      file: error ? null : file,
      fileError: error,
      dryRunResult: null,
      dryRunError: null,
    }));
  };

  const handleFileClear = () => {
    setState((prev) => ({
      ...prev,
      file: null,
      fileError: null,
      dryRunResult: null,
      dryRunError: null,
    }));
  };

  const handleModeChange = (mode: ImportMode) => {
    setState((prev) => ({ ...prev, mode, dryRunResult: null }));
  };

  const runDryRun = async () => {
    if (!state.courseId || !state.unitId || !state.file) return;
    setState((prev) => ({ ...prev, dryRunLoading: true, dryRunError: null }));

    const formData = new FormData();
    formData.append("file", state.file);
    formData.append("mode", state.mode);

    try {
      const res = await apiClient.post<DryRunResult>(
        `/api/admin/courses/${state.courseId}/units/${state.unitId}/import_questions/dry_run`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setState((prev) => ({
        ...prev,
        dryRunResult: res.data,
        dryRunLoading: false,
        step: 2,
      }));
    } catch (err) {
      const { status, errors } = extractApiError(err);
      if (status === 401) {
        router.push("/login");
        return;
      }
      if (status === 404) {
        setState((prev) => ({
          ...prev,
          dryRunLoading: false,
          isPreset: false,
          courseId: null,
          unitId: null,
          dryRunError:
            "指定された講座・単元が見つかりません。選択し直してください",
        }));
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
    if (!state.courseId || !state.unitId || !state.file) return;
    setState((prev) => ({ ...prev, submitting: true, submitError: null }));

    const formData = new FormData();
    formData.append("file", state.file);
    formData.append("mode", state.mode);

    try {
      const res = await apiClient.post<ImportAcceptedResult>(
        `/api/admin/courses/${state.courseId}/units/${state.unitId}/import_questions`,
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

  return {
    state,
    handleCourseChange,
    handleUnitChange,
    handleFileSelect,
    handleFileClear,
    handleModeChange,
    goNext,
    goBack,
  };
};
