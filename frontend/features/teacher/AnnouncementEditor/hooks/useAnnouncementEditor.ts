"use client";

import { apiClient } from "@/libs/http/apiClient";
import { buildErrorMessage } from "@/libs/http/buildErrorMessage";
import { extractApiError } from "@/libs/http/extractApiError";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AnnouncementEditData, AnnouncementFormValues } from "../types";

// 編集データの取得エラー。forbiddenは他の教員のお知らせで、再試行しても取得できない。
export type EditFetchError = "forbidden" | "failed";

type Delivery =
  | { status: "draft" }
  | { status: "published" }
  | { status: "scheduled"; scheduled_at: string };

// お知らせ作成・編集画面のデータ取得・保存・配信を行うフック。
// announcementIdが未指定なら新規作成、指定されていれば編集。
// - 編集時は現在の値を取得する。配信済み・存在しない(404)なら一覧へリダイレクトする
// - 新規作成時は配信タイミング(status/scheduled_at)も作成リクエストに含め、1回のPOSTで作成する。
//   作成と配信設定を分けると、配信設定の失敗時に下書きだけが残り再試行で重複するため。
export const useAnnouncementEditor = (announcementId?: number) => {
  const isEditMode = announcementId !== undefined;
  const router = useRouter();
  const [editData, setEditData] = useState<AnnouncementEditData | null>(null);
  const [fetchError, setFetchError] = useState<EditFetchError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode) return;

    const controller = new AbortController();
    setFetchError(null);

    apiClient
      .get<AnnouncementEditData>(
        `/api/teacher/announcements/${announcementId}/edit`,
        { signal: controller.signal },
      )
      .then((res) => setEditData(res.data))
      .catch((err) => {
        if (axios.isCancel(err) || controller.signal.aborted) return;

        const { status } = extractApiError(err);
        if (status === 401) {
          router.push("/login");
          return;
        }
        // 配信済みは編集できないため、存在しない場合と同じく一覧へ戻す
        if (status === 404) {
          router.replace("/teacher/announcements");
          return;
        }

        setFetchError(status === 403 ? "forbidden" : "failed");
      });

    return () => controller.abort();
  }, [isEditMode, announcementId, reloadKey, router]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  const create = useCallback(
    async (
      values: AnnouncementFormValues,
      delivery: Delivery,
      fallback: string,
    ): Promise<void> => {
      setSubmitting(true);
      setSubmitError(null);

      try {
        await apiClient.post<{ announcement_id: number }>(
          "/api/teacher/announcements",
          {
            title: values.title,
            content: values.content,
            announcement_targets: values.targets,
            ...delivery,
          },
        );
        router.push("/teacher/announcements");
      } catch (err) {
        const { status, errors } = extractApiError(err);

        if (status === 401) {
          router.push("/login");
          return;
        }

        setSubmitError(buildErrorMessage(errors, fallback));
      } finally {
        setSubmitting(false);
      }
    },
    [router],
  );

  const onSaveDraft = useCallback(
    (values: AnnouncementFormValues) =>
      create(values, { status: "draft" }, "下書きの保存に失敗しました"),
    [create],
  );

  const onDeliver = useCallback(
    (values: AnnouncementFormValues) => {
      if (values.deliveryTiming === "scheduled") {
        if (!values.scheduledAt) return;
        return create(
          values,
          {
            status: "scheduled",
            scheduled_at: values.scheduledAt.toISOString(),
          },
          "予約配信の設定に失敗しました",
        );
      }
      return create(
        values,
        { status: "published" },
        "お知らせの配信に失敗しました",
      );
    },
    [create],
  );

  return {
    isEditMode,
    editData,
    fetchError,
    refetch,
    submitting,
    submitError,
    onSaveDraft,
    onDeliver,
  };
};
