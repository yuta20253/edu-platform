"use client";

import { Box, CircularProgress } from "@mui/material";
import { useCreateStudent } from "./hooks/useCreateStudent";
import { useCreateStudentForm } from "./hooks/useCreateStudentForm";
import { useCurrentTeacher } from "./hooks/useCurrentTeacher";
import { useGradeOptions } from "./hooks/useGradeOptions";
import { Presenter } from "./Presenter";

export const CreateStudent = () => {
  const { restrictedGradeId, loading: teacherLoading } = useCurrentTeacher();
  const gradeOptions = useGradeOptions(restrictedGradeId);
  const form = useCreateStudentForm();
  const { creating, createErrors, handleCreate } = useCreateStudent();

  if (teacherLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Presenter
      form={form}
      gradeOptions={gradeOptions}
      onCreate={handleCreate}
      creating={creating}
      createErrors={createErrors}
    />
  );
};
