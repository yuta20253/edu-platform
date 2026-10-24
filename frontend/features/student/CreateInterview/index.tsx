"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useCreateInterview } from "./hooks/useCreateInterview";
import { Presenter } from "./Presenter";
import { Teacher } from "./types";

export const CreateInterview = () => {
  // 申請先として選べる、自分の学級の担当教員一覧
  const { data, error, refetch } = useApiQuery<{ teachers: Teacher[] }>(
    "/api/student/teachers",
  );
  const { onSubmit, submitError } = useCreateInterview();

  return (
    <AsyncBoundary
      data={data}
      error={error}
      errorMessage="先生の一覧を取得できませんでした"
      onRetry={refetch}
    >
      {({ teachers }) => (
        <Presenter
          teachers={teachers}
          onSubmit={onSubmit}
          submitError={submitError}
        />
      )}
    </AsyncBoundary>
  );
};
