"use client";

import { apiClient } from "@/libs/http/apiClient";
import { extractApiError } from "@/libs/http/extractApiError";
import type {
  AdminNoticeDetail,
  CreateNoticeInput,
  UpdateNoticeInput,
} from "@/types/announcement/admin-notice";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { NoticeFormValues } from "../types";

type UseNoticeEditorParams = {
  // 未指定なら新規作成、指定されていれば編集対象のお知らせID
  noticeId?: number;
};

const buildErrorMessage = (errors: string[] | undefined, fallback: string) =>
  errors && errors.length > 0 ? errors.join("\n") : fallback;

// お知らせ作成・編集画面のデータ取得・保存を行うフック。
// - 編集時は既存データを取得し、配信済みなら一覧へリダイレクトする
// - 下書き保存は新規作成時のみstatus: draftを送る
//   （編集時は既存のstatusを変更せず、タイトル・本文のみ更新する）
// - 即時配信は、新規作成時はstatus: publishedで直接作成し、
//   編集時は内容を保存した後に専用のpublishエンドポイントを呼ぶ
export const useNoticeEditor = ({ noticeId }: UseNoticeEditorParams) => {
  const isEditMode = noticeId !== undefined;
  const router = useRouter();

  const [notice, setNotice] = useState<AdminNoticeDetail | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchNotice = useCallback(() => {
    if (!isEditMode) return;

    setLoading(true);
    setFetchError(null);

    apiClient
      .get<{ announcement: AdminNoticeDetail }>(
        `/api/admin/notices/${noticeId}`,
      )
      .then((res) => {
        const data = res.data.announcement;

        // 配信済みのお知らせは編集不可のため一覧へリダイレクトする
        if (data.status === "published") {
          router.replace("/admin/notices");
          return;
        }

        setNotice(data);
      })
      .catch((err) => {
        const { status } = extractApiError(err);

        if (status === 401) {
          router.push("/login");
          return;
        }

        setFetchError(
          status === 404
            ? "お知らせが見つかりませんでした"
            : "お知らせの取得に失敗しました",
        );
      })
      .finally(() => setLoading(false));
  }, [isEditMode, noticeId, router]);

  useEffect(() => {
    fetchNotice();
  }, [fetchNotice]);

  const runRequest = useCallback(
    async (
      request: () => Promise<unknown>,
      fallback: string,
    ): Promise<boolean> => {
      setSubmitting(true);
      setSubmitError(null);

      try {
        await request();
        return true;
      } catch (err) {
        const { status, errors } = extractApiError(err);

        if (status === 401) {
          router.push("/login");
          return false;
        }

        setSubmitError(buildErrorMessage(errors, fallback));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [router],
  );

  // 下書き保存はstatus: draftを明示的に送る。既に下書きの場合はdraft→draftの
  // 無変更なので問題なく保存されるが、予約配信中のお知らせに対して下書き保存を
  // 選ぶことは「配信予約を取り消す」意思表示であり、Rails側がscheduled→draftの
  // 遷移を許可していないため422で拒否される（エラーはsubmitErrorに表示される）。
  const saveDraft = useCallback(
    async (values: NoticeFormValues): Promise<void> => {
      const payload: CreateNoticeInput = {
        title: values.title,
        content: values.content,
        status: "draft",
        scheduled_at: null,
      };

      const ok = await runRequest(
        () =>
          isEditMode
            ? apiClient.patch(`/api/admin/notices/${noticeId}`, payload)
            : apiClient.post("/api/admin/notices", payload),
        "下書きの保存に失敗しました",
      );

      if (ok) router.push("/admin/notices");
    },
    [isEditMode, noticeId, router, runRequest],
  );

  const schedule = useCallback(
    async (values: NoticeFormValues, scheduledAt: Date): Promise<void> => {
      const payload: CreateNoticeInput | UpdateNoticeInput = {
        title: values.title,
        content: values.content,
        status: "scheduled",
        scheduled_at: scheduledAt.toISOString(),
      };

      const ok = await runRequest(
        () =>
          isEditMode
            ? apiClient.patch(`/api/admin/notices/${noticeId}`, payload)
            : apiClient.post("/api/admin/notices", payload),
        "予約配信の設定に失敗しました",
      );

      if (ok) router.push("/admin/notices");
    },
    [isEditMode, noticeId, router, runRequest],
  );

  const publishNow = useCallback(
    async (values: NoticeFormValues): Promise<void> => {
      if (isEditMode) {
        const saved = await runRequest(
          () =>
            apiClient.patch(`/api/admin/notices/${noticeId}`, {
              title: values.title,
              content: values.content,
            }),
          "お知らせの保存に失敗しました",
        );
        if (!saved) return;

        const published = await runRequest(
          () => apiClient.post(`/api/admin/notices/${noticeId}/publish`),
          "お知らせの配信に失敗しました",
        );
        if (published) router.push("/admin/notices");
        return;
      }

      const payload: CreateNoticeInput = {
        title: values.title,
        content: values.content,
        status: "published",
        scheduled_at: null,
      };
      const ok = await runRequest(
        () => apiClient.post("/api/admin/notices", payload),
        "お知らせの配信に失敗しました",
      );
      if (ok) router.push("/admin/notices");
    },
    [isEditMode, noticeId, router, runRequest],
  );

  const onDeliver = useCallback(
    (values: NoticeFormValues) => {
      if (values.deliveryTiming === "scheduled") {
        if (!values.scheduledAt) return;
        return schedule(values, values.scheduledAt);
      }
      return publishNow(values);
    },
    [schedule, publishNow],
  );

  return {
    isEditMode,
    notice,
    loading,
    fetchError,
    refetch: fetchNotice,
    submitting,
    submitError,
    onSaveDraft: saveDraft,
    onDeliver,
  };
};
