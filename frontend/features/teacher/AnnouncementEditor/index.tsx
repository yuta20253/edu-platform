"use client";

import { Presenter } from "./Presenter";
import { useAnnouncementEditor } from "./hooks/useAnnouncementEditor";
import { useAnnouncementTargetOptions } from "./hooks/useAnnouncementTargetOptions";

export const AnnouncementEditor = () => {
  // 学年・権限・学年制限の取得用。生徒検索は「個人」の行ごとにStudentPickerが行う
  const { data: options, error: optionsError } = useAnnouncementTargetOptions(
    "",
    1,
  );
  const { editData, submitting, submitError, onSaveDraft, onDeliver } =
    useAnnouncementEditor();

  return (
    <Presenter
      editData={editData}
      options={options}
      submitting={submitting}
      submitError={submitError}
      optionsError={optionsError}
      onSaveDraft={onSaveDraft}
      onDeliver={onDeliver}
    />
  );
};
