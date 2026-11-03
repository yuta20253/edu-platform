"use client";

import { useForm } from "react-hook-form";
import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Presenter } from "./Presenter";
import { useSubmit } from "./hooks/useSubmit";
import { EditGoalForm, Goal } from "./types";

type Props = {
  goalId: number;
};

export const EditGoal = ({ goalId }: Props) => {
  const { data, error, errorStatus, refetch } = useApiQuery<Goal>(
    `/api/student/goals/${goalId}`,
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditGoalForm>();

  const { onSubmit, toast, closeToast } = useSubmit({ goalId });

  return (
    <AsyncBoundary
      data={data}
      error={error}
      errorMessage={
        errorStatus === 404
          ? "目標が見つかりませんでした"
          : "目標の取得に失敗しました"
      }
      onRetry={refetch}
    >
      {(goal) => (
        <Presenter
          goal={goal}
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
