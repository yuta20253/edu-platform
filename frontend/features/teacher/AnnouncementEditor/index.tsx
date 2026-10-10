"use client";

import { Presenter } from "./Presenter";
import { useAnnouncementEditor } from "./hooks/useAnnouncementEditor";
import { useAnnouncementTargetOptions } from "./hooks/useAnnouncementTargetOptions";

export const AnnouncementEditor = () => {
  // 学年・権限・学年制限の取得用。生徒検索は「個人」の行ごとにStudentPickerが行う
  const { data: options } = useAnnouncementTargetOptions("", 1);
  const { submitting, submitError, onSaveDraft, onDeliver } =
    useAnnouncementEditor();

  return (
    <Presenter
      options={options}
      submitting={submitting}
      submitError={submitError}
      onSaveDraft={onSaveDraft}
      onDeliver={onDeliver}
    />
  );
};
