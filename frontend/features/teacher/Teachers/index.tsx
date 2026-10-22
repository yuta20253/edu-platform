"use client";

import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { useFetchTeachers } from "./hooks/useFetchTeachers";
import { Presenter } from "./Presenter";
import { useCreateTeacher } from "./hooks/useCreateTeacher";
import { useGradeOptions } from "./hooks/useGradeOptions";
import { useCreateTeacherForm } from "./hooks/useCreateTeacherForm";

export const Teachers = () => {
  const { data, error, page, setPage, refetch } = useFetchTeachers();

  const form = useCreateTeacherForm();

  const {
    drawerOpen,
    creating,
    createErrors,
    snackbar,
    handleAddClick,
    handleDrawerClose,
    handleCreate,
    handleSnackbarClose,
  } = useCreateTeacher({ onCreated: refetch, form });

  const gradeOptions = useGradeOptions(drawerOpen);

  return (
    <AsyncBoundary data={data} error={error} onRetry={refetch}>
      {(teachers) => (
        <Presenter
          data={teachers}
          page={page}
          onPageChange={setPage}
          drawerOpen={drawerOpen}
          onAddClick={handleAddClick}
          onDrawerClose={handleDrawerClose}
          onCreate={handleCreate}
          creating={creating}
          createErrors={createErrors}
          snackbar={snackbar}
          onSnackbarClose={handleSnackbarClose}
          form={form}
          gradeOptions={gradeOptions}
        />
      )}
    </AsyncBoundary>
  );
};
