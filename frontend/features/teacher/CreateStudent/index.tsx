"use client";

// eslint-disable-next-line no-restricted-imports -- 表示規約の例外(一時): TSK-231 で移行予定
import { Alert, Box, CircularProgress } from "@mui/material";
import { useCreateStudent } from "./hooks/useCreateStudent";
import { useCreateStudentForm } from "./hooks/useCreateStudentForm";
import { useCurrentTeacher } from "./hooks/useCurrentTeacher";
import { useGradeOptions } from "./hooks/useGradeOptions";
import { Presenter } from "./Presenter";

export const CreateStudent = () => {
  const {
    restrictedGradeId,
    loading: teacherLoading,
    error: teacherError,
  } = useCurrentTeacher();
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

  if (teacherError) {
    return (
      <Box sx={{ p: 3 }}>
        {/* eslint-disable-next-line no-restricted-syntax -- 表示規約の例外(一時): TSK-231 で移行予定 */}
        <Alert severity="error">
          教員情報の取得に失敗しました。再読み込みしてください。
        </Alert>
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
