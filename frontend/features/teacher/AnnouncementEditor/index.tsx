"use client";

import { useState } from "react";
import { Presenter } from "./Presenter";
import { useAnnouncementEditor } from "./hooks/useAnnouncementEditor";
import { useAnnouncementTargetOptions } from "./hooks/useAnnouncementTargetOptions";

export const AnnouncementEditor = () => {
  const [studentKeyword, setStudentKeyword] = useState("");
  const { data: options } = useAnnouncementTargetOptions(studentKeyword, 1);
  const { submitting, submitError, onSaveDraft, onDeliver } =
    useAnnouncementEditor();

  return (
    <Presenter
      options={options}
      studentKeyword={studentKeyword}
      onStudentKeywordChange={setStudentKeyword}
      submitting={submitting}
      submitError={submitError}
      onSaveDraft={onSaveDraft}
      onDeliver={onDeliver}
    />
  );
};
