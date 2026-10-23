"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { Box, Button } from "@mui/material";
import Link from "next/link";
import { Presenter } from "./Presenter";
import { useAnnouncementEditor } from "./hooks/useAnnouncementEditor";
import { useAnnouncementTargetOptions } from "./hooks/useAnnouncementTargetOptions";
import type { AnnouncementEditData } from "./types";

type Props = {
  // 未指定なら新規作成、指定されていれば編集対象のお知らせID
  announcementId?: number;
};

export const AnnouncementEditor = ({ announcementId }: Props) => {
  // 学年・権限・学年制限の取得用。生徒検索は「個人」の行ごとにStudentPickerが行う
  const { data: options, error: optionsError } = useAnnouncementTargetOptions(
    "",
    1,
  );
  const {
    isEditMode,
    editData,
    fetchError,
    refetch,
    submitting,
    submitError,
    onSaveDraft,
    onDeliver,
  } = useAnnouncementEditor(announcementId);

  const renderPresenter = (data: AnnouncementEditData | null) => (
    <Presenter
      editData={data}
      options={options}
      submitting={submitting}
      submitError={submitError}
      optionsError={optionsError}
      onSaveDraft={onSaveDraft}
      onDeliver={onDeliver}
    />
  );

  if (!isEditMode) return renderPresenter(null);

  // 他の教員のお知らせは再試行しても取得できないため、再試行ではなく一覧へ戻る導線を出す
  if (fetchError === "forbidden") {
    return (
      <Box>
        <ErrorState message="このお知らせは編集できません" />
        <Box sx={{ px: 3 }}>
          <Button component={Link} href="/teacher/announcements">
            お知らせ一覧へ戻る
          </Button>
        </Box>
      </Box>
    );
  }

  // 現在の値はuseFormの初期値になるため、取得が終わるまでPresenterを描画しない
  return (
    <AsyncBoundary
      data={editData}
      error={fetchError === "failed"}
      onRetry={refetch}
      errorMessage="お知らせの取得に失敗しました"
    >
      {renderPresenter}
    </AsyncBoundary>
  );
};
