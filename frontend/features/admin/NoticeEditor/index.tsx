"use client";

import { Box } from "@mui/material";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Presenter } from "./Presenter";
import { useNoticeEditor } from "./hooks/useNoticeEditor";

type Props = {
  // 未指定なら新規作成、指定されていれば編集対象のお知らせID
  noticeId?: number;
};

export const NoticeEditor = ({ noticeId }: Props) => {
  const {
    isEditMode,
    notice,
    loading,
    fetchError,
    refetch,
    submitting,
    submitError,
    onSaveDraft,
    onDeliver,
  } = useNoticeEditor({ noticeId });

  if (fetchError) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorState message={fetchError} onRetry={refetch} />
      </Box>
    );
  }

  // 編集時、詳細取得が完了する（配信済みならリダイレクトされる）までは表示しない
  if (isEditMode && (loading || !notice)) {
    return (
      <Box sx={{ p: 3 }}>
        <CardSkeleton lines={6} />
      </Box>
    );
  }

  return (
    <Presenter
      notice={notice}
      submitting={submitting}
      submitError={submitError}
      onSaveDraft={onSaveDraft}
      onDeliver={onDeliver}
    />
  );
};
