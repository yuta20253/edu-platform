"use client";

import { apiClient } from "@/libs/http/apiClient";
import { buildErrorMessage } from "@/libs/http/buildErrorMessage";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { AnnouncementFormValues } from "../types";

type Delivery =
  | { status: "draft" }
  | { status: "published" }
  | { status: "scheduled"; scheduled_at: string };

// お知らせ新規作成画面の保存・配信を行うフック。
// 配信タイミング(status/scheduled_at)も作成リクエストに含め、1回のPOSTで作成する。
// 作成と配信設定を分けると、配信設定の失敗時に下書きだけが残り再試行で重複するため。
export const useAnnouncementEditor = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    submitting,
    submitError,
    onSaveDraft,
    onDeliver,
  };
};
