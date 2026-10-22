"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Presenter } from "./Presenter";
import { Teacher } from "./types";

type Props = {
  teacherId: number;
};

export const TeacherDetail = ({ teacherId }: Props) => {
  const { data, error, refetch } = useApiQuery<Teacher>(
    `/api/teacher/teachers/${teacherId}`,
  );

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(teacher) => <Presenter teacher={teacher} />}
    </AsyncBoundary>
  );
};
