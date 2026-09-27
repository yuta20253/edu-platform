"use client";

import { Alert, Box, Button, CircularProgress } from "@mui/material";
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
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              再試行
            </Button>
          }
        >
          {fetchError}
        </Alert>
      </Box>
    );
  }

  // 編集時、詳細取得が完了する（配信済みならリダイレクトされる）までは表示しない
  if (isEditMode && (loading || !notice)) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
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
