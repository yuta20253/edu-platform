"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Presenter } from "./Presenter";
import { useForm } from "react-hook-form";
import { EditTaskForm, Task } from "./types";
import { useSubmit } from "./hooks/useSubmit";
import { useCourses } from "@/hooks/useCourses";
import { useUnitSelection } from "@/hooks/useUnitSelection";
import { useEffect } from "react";

type Props = {
  goalId?: number;
  taskId: number;
};

export const EditTask = ({ goalId, taskId }: Props) => {
  const { data, error, errorStatus, refetch } = useApiQuery<Task>(
    `/api/student/tasks/${taskId}`,
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditTaskForm>();

  const {
    courses,
    selectedCourseId,
    showAllCourses,
    fetchCourse,
    selectedCourse,
    displayedCourses,
    setSelectedCourseId,
    setShowAllCourses,
  } = useCourses();

  const { selectedUnitIds, handleToggleUnit, setSelectedUnitIds } =
    useUnitSelection();

  const { onSubmit, toast, closeToast } = useSubmit({
    goalId,
    taskId,
    selectedUnitIds,
  });

  useEffect(() => {
    if (!data?.units) return;
    const unitIds = data.units.map((u) => u.id);
    setSelectedUnitIds(unitIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.units]);

  return (
    <AsyncBoundary
      data={data}
      error={error}
      errorMessage={
        errorStatus === 404
          ? "タスクが見つかりませんでした"
          : "タスクの取得に失敗しました"
      }
      onRetry={refetch}
    >
      {(task) => (
        <Presenter
          goalId={goalId}
          task={task}
          courses={courses}
          selectedCourseId={selectedCourseId}
          showAllCourses={showAllCourses}
          fetchCourse={fetchCourse}
          selectedCourse={selectedCourse}
          displayedCourses={displayedCourses}
          setSelectedCourseId={setSelectedCourseId}
          setShowAllCourses={setShowAllCourses}
          selectedUnitIds={selectedUnitIds}
          handleToggleUnit={handleToggleUnit}
          register={register}
          control={control}
          errors={errors}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          toast={toast}
          closeToast={closeToast}
        />
      )}
    </AsyncBoundary>
  );
};
