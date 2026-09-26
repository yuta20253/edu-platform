"use client";

import { colors } from "@/app/theme/colors";
import { FormSection } from "@/components/StudentForm";
import { PrimaryCta } from "@/components/PrimaryCta";
import {
  Box,
  Backdrop,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegisterTask } from "./hooks";
import { priorityMap } from "./constants";
import { useFetchGoal } from "./useFetchGoal";
import { useFetchDraftTask } from "./useFetchDraftTask";

const Field = ({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}): React.JSX.Element => (
  <Box sx={{ mb: 1.5 }}>
    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
      {label}
    </Typography>
    <Typography sx={{ fontSize: 14, whiteSpace: "pre-wrap" }}>
      {children}
    </Typography>
  </Box>
);

type GoalIdProps = {
  goalId: number;
  draftTaskId: number;
};

export const CreateTaskConfirm = ({
  goalId,
  draftTaskId,
}: GoalIdProps): React.JSX.Element => {
  const router = useRouter();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const { goal } = useFetchGoal(goalId);
  const { draftTask, isLoading } = useFetchDraftTask(draftTaskId);

  const { registerTask } = useRegisterTask();

  const handleRegister = async () => {
    try {
      if (!draftTask) return;

      await registerTask(draftTask);

      setSnackbar({
        open: true,
        message: "タスクが登録されました！",
        severity: "success",
      });

      setTimeout(() => router.push("/"), 1000);
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: "タスク登録に失敗しました",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{ fontWeight: 800, mt: 1, mb: 1 }}
        >
          確認
        </Typography>

        <FormSection title="目標内容">
          <Field label="タイトル">{goal?.title}</Field>
          <Field label="期限">{goal?.due_date}</Field>
          <Field label="説明">{goal?.description}</Field>
        </FormSection>

        <FormSection title="登録するタスク">
          <Field label="タイトル">{draftTask?.title}</Field>
          <Field label="内容">{draftTask?.content}</Field>
          <Field label="優先度">
            {draftTask?.priority && priorityMap[draftTask?.priority]}
          </Field>
          <Field label="期限">{draftTask?.due_date}</Field>
          <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 2, mb: 1 }}>
            {draftTask?.units?.[0]?.course.level_name}レベル
            {draftTask?.units?.[0]?.course.level_number}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {draftTask?.units.map((unit) => (
              <Box
                key={unit.id}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 999,
                  bgcolor: colors.accent[100],
                  color: colors.accent[800],
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {unit.unit_name}
              </Box>
            ))}
          </Box>
        </FormSection>

        <Box sx={{ mt: 4, mb: 2, display: "flex", gap: 1.25 }}>
          <PrimaryCta
            variant="outlined"
            onClick={() =>
              router.push(
                `/goals/${goalId}/tasks/new?draftTaskId=${draftTaskId}`,
              )
            }
            sx={{ flex: 1 }}
          >
            キャンセル
          </PrimaryCta>
          <PrimaryCta onClick={handleRegister} sx={{ flex: 1 }}>
            登録する
          </PrimaryCta>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
      <Backdrop
        open={isLoading}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress size="4rem" />
      </Backdrop>
    </>
  );
};
