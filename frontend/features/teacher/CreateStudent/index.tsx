"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useCreateStudent } from "./hooks/useCreateStudent";
import { useCreateStudentForm } from "./hooks/useCreateStudentForm";
import { useCurrentTeacher } from "./hooks/useCurrentTeacher";
import { useGradeOptions } from "./hooks/useGradeOptions";
import { Presenter } from "./Presenter";

export const CreateStudent = () => {
  // 2本の取得を並列に始めるため、フックは AsyncBoundary の外で呼ぶ
  const {
    data: teacher,
    restrictedGradeId,
    error: teacherError,
    refetch: refetchTeacher,
  } = useCurrentTeacher();
  const {
    gradeOptions,
    error: gradeOptionsError,
    refetch: refetchGradeOptions,
  } = useGradeOptions(restrictedGradeId);
  const form = useCreateStudentForm();
  const { creating, createErrors, handleCreate } = useCreateStudent();

  // 学年制限(/me)が分かるまで選択肢を見せない。両方そろったときだけ data にする
  const data = teacher ? gradeOptions : null;

  // 失敗した側だけ再取得する(成功した側を無駄に取り直さない)
  const handleRetry = () => {
    if (teacherError) refetchTeacher();
    if (gradeOptionsError) refetchGradeOptions();
  };

  return (
    <AsyncBoundary
      data={data}
      error={teacherError || gradeOptionsError}
      onRetry={handleRetry}
      errorMessage="教員情報・学級の取得に失敗しました"
    >
      {(options) => (
        <Presenter
          form={form}
          gradeOptions={options}
          onCreate={handleCreate}
          creating={creating}
          createErrors={createErrors}
        />
      )}
    </AsyncBoundary>
  );
};
