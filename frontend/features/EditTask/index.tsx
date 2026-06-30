"use client";

import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { Presenter } from "./Presenter";
import { useFetchTask } from "./hooks/useFetchTask";
import { useForm } from "react-hook-form";
import { EditTaskForm } from "./types";
import { useSubmit } from "./hooks/useSubmit";
import { useCourses } from "@/hooks/useCourses";
import { useUnitSelection } from "@/hooks/useUnitSelection";
import { useEffect } from "react";

type Props = {
  goalId?: number;
  taskId: number;
};

export const EditTask = ({ goalId, taskId }: Props) => {
  const { task, fetchError, refetch } = useFetchTask(taskId);

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
    if (!task?.units) return;
    const unitIds = task?.units?.map((u) => u.id) ?? [];
    setSelectedUnitIds(unitIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.units]);

  if (fetchError) {
    return (
      <Box
        sx={{
          mt: 10,
          display: "flex",
          justifyContent: "center",
          px: 3,
        }}
      >
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              再試行
            </Button>
          }
        >
          {fetchError}
        </Alert>
      </Box>
    );
  }

  if (!task) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
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
  );
};
