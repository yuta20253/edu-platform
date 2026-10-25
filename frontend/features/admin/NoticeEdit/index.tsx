"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "@/features/admin/NoticeEditor/Presenter";
import { useNoticeSubmit } from "@/features/admin/NoticeEditor/hooks/useNoticeSubmit";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { AdminNoticeDetail } from "@/types/announcement/admin-notice";

type Props = {
  noticeId: number;
};

// お知らせの編集画面。既存のお知らせを取得してフォームに反映する。
export const NoticeEdit = ({ noticeId }: Props) => {
  const { data, error, errorStatus, refetch } = useApiQuery<{
    announcement: AdminNoticeDetail;
  }>(`/api/admin/notices/${noticeId}`);
  const submit = useNoticeSubmit({ noticeId });

  return (
    <AsyncBoundary
      data={data?.announcement ?? null}
      error={error}
      errorMessage={
        errorStatus === 404
          ? "お知らせが見つかりませんでした"
          : "お知らせの取得に失敗しました"
      }
      onRetry={refetch}
      fallback="card-skeleton"
      skeletonProps={{ lines: 6 }}
    >
      {(notice) => <Presenter notice={notice} {...submit} />}
    </AsyncBoundary>
  );
};
