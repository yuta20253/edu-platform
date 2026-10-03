"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { AnnouncementFormValues } from "../types";

const buildErrorMessage = (errors: string[] | undefined, fallback: string) =>
  errors && errors.length > 0 ? errors.join("\n") : fallback;

// お知らせ新規作成画面の保存・配信を行うフック。
// Rails側の仕様上、新規作成は常にdraftで作成されるため
// (POST /api/teacher/announcements)、即時公開・予約投稿は
// 作成後に続けてステータス更新(PATCH /api/teacher/announcements/:id)を呼ぶ
// 2段階フローになる。
export const useAnnouncementEditor = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const runRequest = useCallback(
    async <T>(
      request: () => Promise<T>,
      fallback: string,
    ): Promise<T | undefined> => {
      setSubmitting(true);
      setSubmitError(null);

      try {
        return await request();
      } catch (err) {
        const { status, errors } = extractApiError(err);

        if (status === 401) {
          router.push("/login");
          return undefined;
        }

        setSubmitError(buildErrorMessage(errors, fallback));
        return undefined;
      } finally {
        setSubmitting(false);
      }
    },
    [router],
  );

  const createDraft = useCallback(
    (values: AnnouncementFormValues) =>
      apiClient.post<{ announcement_id: number }>(
        "/api/teacher/announcements",
        {
          title: values.title,
          content: values.content,
          announcement_targets: values.targets,
        },
      ),
    [],
  );

  const saveDraft = useCallback(
    async (values: AnnouncementFormValues): Promise<void> => {
      const res = await runRequest(
        () => createDraft(values),
        "下書きの保存に失敗しました",
      );
      if (res) router.push("/teacher/announcements");
    },
    [createDraft, router, runRequest],
  );

  const publishNow = useCallback(
    async (values: AnnouncementFormValues): Promise<void> => {
      const created = await runRequest(
        () => createDraft(values),
        "お知らせの作成に失敗しました",
      );
      if (!created) return;

      const published = await runRequest(
        () =>
          apiClient.patch(
            `/api/teacher/announcements/${created.data.announcement_id}`,
            { status: "published" },
          ),
        "お知らせの公開に失敗しました",
      );
      if (published) router.push("/teacher/announcements");
    },
    [createDraft, router, runRequest],
  );

  const schedule = useCallback(
    async (
      values: AnnouncementFormValues,
      scheduledAt: Date,
    ): Promise<void> => {
      const created = await runRequest(
        () => createDraft(values),
        "お知らせの作成に失敗しました",
      );
      if (!created) return;

      const scheduled = await runRequest(
        () =>
          apiClient.patch(
            `/api/teacher/announcements/${created.data.announcement_id}`,
            { status: "scheduled", scheduled_at: scheduledAt.toISOString() },
          ),
        "予約投稿の設定に失敗しました",
      );
      if (scheduled) router.push("/teacher/announcements");
    },
    [createDraft, router, runRequest],
  );

  const onDeliver = useCallback(
    (values: AnnouncementFormValues) => {
      if (values.deliveryTiming === "scheduled") {
        if (!values.scheduledAt) return;
        return schedule(values, values.scheduledAt);
      }
      return publishNow(values);
    },
    [schedule, publishNow],
  );

  return {
    submitting,
    submitError,
    onSaveDraft: saveDraft,
    onDeliver,
  };
};
