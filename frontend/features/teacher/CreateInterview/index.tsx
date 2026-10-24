"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useCreateInterview } from "./hooks/useCreateInterview";
import { useStudentOptions } from "./hooks/useStudentOptions";
import { Presenter } from "./Presenter";

type Props = {
  initialStudentId?: number;
};

export const CreateInterview = ({ initialStudentId }: Props) => {
  const { data, error, refetch } = useStudentOptions();
  const { onSubmit, submitError } = useCreateInterview();

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(students) => (
        <Presenter
          students={students}
          initialStudentId={initialStudentId}
          onSubmit={onSubmit}
          submitError={submitError}
        />
      )}
    </AsyncBoundary>
  );
};
