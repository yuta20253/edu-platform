"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Presenter } from "./Presenter";
import { useForm } from "react-hook-form";
import { EditTaskForm, Task } from "./types";
import { useSubmit } from "./hooks/useSubmit";
import { useCourses } from "@/hooks/useCourses";
import { useUnitSelection } from "@/hooks/useUnitSelection";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

type Props = {
  goalId?: number;
  taskId: number;
};

export const EditTask = ({ goalId, taskId }: Props) => {
  const { data, error, errorStatus, refetch } = useApiQuery<Task>(
    `/api/student/tasks/${taskId}`,
  );

  // 期限のバリデーション(目標の期限以前か)にだけ使う。取得できなくても
  // フォームの表示自体はブロックしない(バックエンド側のバリデーションが最終防衛)
  const { data: goal } = useApiQuery<{ due_date: string }>(
    `/api/student/goals/${data?.goal_id ?? 0}`,
    { enabled: !!data?.goal_id },
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
    selectedSubject,
    showAllCourses,
    fetchCourse,
    selectedCourse,
    displayedCourses,
    setSelectedCourseId,
    setShowAllCourses,
  } = useCourses();

  const [coursesLoadFailed, setCoursesLoadFailed] = useState(false);

  const { selectedUnitIds, handleToggleUnit, setSelectedUnitIds } =
    useUnitSelection();

  const { onSubmit, toast, closeToast } = useSubmit({
    goalId,
    taskId,
    selectedUnitIds,
  });

  // 取得したタスクで、単元・教科・講座の選択を一度だけ初期化する。
  // data?.units の参照が変わる(再取得など)と、利用者が途中で操作した選択も初期化される
  useEffect(() => {
    if (!data?.units) return;
    setSelectedUnitIds(data.units.map((u) => u.id));

    // 1タスクは1講座(1教科)の単元だけを持つ(作成・編集画面は1つの講座の単元しか選べない)ため、
    // 先頭の単元の講座で復元する
    const course = data.units[0]?.course;
    if (!course) return;

    // 復元の完了前に利用者が教科を選び直したり、画面を離れたりしたときは、元の講座で上書きしない
    let cancelled = false;
    setCoursesLoadFailed(false);
    fetchCourse(course.subject_name).then((ok) => {
      if (cancelled) return;
      if (ok) {
        setSelectedCourseId(course.id);
      } else {
        setCoursesLoadFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [data?.units, fetchCourse, setSelectedUnitIds, setSelectedCourseId]);

  const retryCourses = (task: Task) => {
    const course = task.units?.[0]?.course;
    if (!course) return;
    fetchCourse(course.subject_name).then((ok) => {
      setCoursesLoadFailed(!ok);
      if (ok) setSelectedCourseId(course.id);
    });
  };

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
        <>
          {coursesLoadFailed && (
            <ErrorState
              message="講座一覧の取得に失敗しました"
              onRetry={() => retryCourses(task)}
            />
          )}
          <Presenter
            goalId={goalId}
            task={task}
            courses={courses}
            selectedCourseId={selectedCourseId}
            selectedSubject={selectedSubject}
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
            goalDueDate={goal?.due_date}
          />
        </>
      )}
    </AsyncBoundary>
  );
};
