"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { Presenter } from "./Presenter";
import { useTeacherDetail } from "./hooks";

type Props = {
  teacherId: number;
};

export const TeacherDetail = ({ teacherId }: Props) => {
  const { data, error, refetch } = useTeacherDetail(teacherId);

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(teacher) => <Presenter teacher={teacher} />}
    </AsyncBoundary>
  );
};
