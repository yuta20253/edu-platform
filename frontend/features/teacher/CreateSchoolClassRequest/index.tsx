"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useCreateSchoolClassRequest } from "./hooks/useCreateSchoolClassRequest";
import { Presenter } from "./Presenter";
import { GradeOption } from "./types";

export const CreateSchoolClassRequest = () => {
  // 学年と、改名・削除の対象に選べるクラスは学級一覧APIから取る
  const { data, error, refetch } = useApiQuery<GradeOption[]>(
    "/api/teacher/school-classes",
  );
  const { onSubmit, submitError } = useCreateSchoolClassRequest();

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(grades) => (
        <Presenter
          grades={grades}
          onSubmit={onSubmit}
          submitError={submitError}
        />
      )}
    </AsyncBoundary>
  );
};
