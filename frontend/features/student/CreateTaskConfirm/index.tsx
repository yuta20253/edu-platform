"use client";

import { colors } from "@/app/theme/colors";
import { AsyncBoundary } from "@/components/ui/AsyncBoundary";
import { FormSection } from "@/components/student/Form";
import { PrimaryCta } from "@/components/PrimaryCta";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Box, Typography, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegisterTask } from "./hooks";
import { priorityMap } from "./constants";
import type { GoalType } from "./types";
import type { DraftTaskType } from "./useFetchDraftTask";

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

type BodyProps = GoalIdProps & {
  goal: GoalType;
  draftTask: DraftTaskType;
};

// 目標と下書きタスクの両方が取得できてから描画する。取得前の null を扱う分岐は持たない。
const CreateTaskConfirmBody = ({
  goalId,
  draftTaskId,
  goal,
  draftTask,
}: BodyProps): React.JSX.Element => {
  const router = useRouter();
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const { registerTask } = useRegisterTask();

  const handleRegister = async () => {
    try {
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
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, mt: 1, mb: 1 }}
      >
        確認
      </Typography>

      <FormSection title="目標内容">
        <Field label="タイトル">{goal.title}</Field>
        <Field label="期限">{goal.due_date}</Field>
        <Field label="説明">{goal.description}</Field>
      </FormSection>

      <FormSection title="登録するタスク">
        <Field label="タイトル">{draftTask.title}</Field>
        <Field label="内容">{draftTask.content}</Field>
        <Field label="優先度">
          {draftTask.priority && priorityMap[draftTask.priority]}
        </Field>
        <Field label="期限">{draftTask.due_date}</Field>
        <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 2, mb: 1 }}>
          {draftTask.units[0]?.course.level_name}レベル
          {draftTask.units[0]?.course.level_number}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {draftTask.units.map((unit) => (
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
            router.push(`/goals/${goalId}/tasks/new?draftTaskId=${draftTaskId}`)
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
  );
};

export const CreateTaskConfirm = ({
  goalId,
  draftTaskId,
}: GoalIdProps): React.JSX.Element => {
  const goal = useApiQuery<GoalType>(`/api/student/goals/${goalId}`);
  const draftTask = useApiQuery<DraftTaskType>(
    `/api/student/draft-tasks/${draftTaskId}`,
  );

  // 両方が揃ってから確認画面を出す。片方でも失敗したらエラー表示にして、
  // 再試行で両方を取り直す(成功した側は useApiQuery が再取得中も data を残す)。
  const loaded =
    goal.data && draftTask.data
      ? { goal: goal.data, draftTask: draftTask.data }
      : null;

  return (
    <AsyncBoundary
      data={loaded}
      error={goal.error || draftTask.error}
      onRetry={() => {
        goal.refetch();
        draftTask.refetch();
      }}
    >
      {(ready) => (
        <CreateTaskConfirmBody
          goalId={goalId}
          draftTaskId={draftTaskId}
          goal={ready.goal}
          draftTask={ready.draftTask}
        />
      )}
    </AsyncBoundary>
  );
};
