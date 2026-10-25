"use client";

import { Alert, Box, Button } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "@/features/admin/NoticeEditor/Presenter";
import { useNoticeSubmit } from "@/features/admin/NoticeEditor/hooks/useNoticeSubmit";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { AdminNoticeDetail } from "@/types/announcement/admin-notice";

type Props = {
  noticeId: number;
};

// 配信済みのお知らせは編集できないため、フォームの代わりに案内を表示する。
// 一覧へのリダイレクトが終わるまで(または失敗しても)画面が止まらないようにする。
const PublishedNotice = () => (
  <Box sx={{ p: 3 }}>
    <Alert
      severity="info"
      action={
        <Button
          color="inherit"
          size="small"
          component={Link}
          href="/admin/notices"
        >
          お知らせ一覧へ戻る
        </Button>
      }
    >
      配信済みのお知らせは編集できません
    </Alert>
  </Box>
);

// お知らせの編集画面。既存のお知らせを取得してフォームに反映する。
export const NoticeEdit = ({ noticeId }: Props) => {
  const router = useRouter();
  const { data, error, errorStatus, refetch } = useApiQuery<{
    announcement: AdminNoticeDetail;
  }>(`/api/admin/notices/${noticeId}`);
  const submit = useNoticeSubmit({ noticeId });

  const notice = data?.announcement ?? null;
  const isPublished = notice?.status === "published";

  useEffect(() => {
    if (isPublished) router.replace("/admin/notices");
  }, [isPublished, router]);

  return (
    <AsyncBoundary
      data={notice}
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
      {(loaded) =>
        loaded.status === "published" ? (
          <PublishedNotice />
        ) : (
          <Presenter notice={loaded} {...submit} />
        )
      }
    </AsyncBoundary>
  );
};
