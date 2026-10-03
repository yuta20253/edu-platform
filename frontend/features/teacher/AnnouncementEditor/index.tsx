"use client";

import { useState } from "react";
import { Presenter } from "./Presenter";
import { useAnnouncementEditor } from "./hooks/useAnnouncementEditor";
import { useAnnouncementTargetOptions } from "./hooks/useAnnouncementTargetOptions";

export const AnnouncementEditor = () => {
  const [studentKeyword, setStudentKeyword] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const { data: options } = useAnnouncementTargetOptions(
    studentKeyword,
    studentPage,
  );
  const { submitting, submitError, onSaveDraft, onDeliver } =
    useAnnouncementEditor();

  const handleStudentKeywordChange = (keyword: string) => {
    setStudentKeyword(keyword);
    setStudentPage(1);
  };

  return (
    <Presenter
      options={options}
      studentKeyword={studentKeyword}
      onStudentKeywordChange={handleStudentKeywordChange}
      studentPage={studentPage}
      onStudentPageChange={setStudentPage}
      submitting={submitting}
      submitError={submitError}
      onSaveDraft={onSaveDraft}
      onDeliver={onDeliver}
    />
  );
};
