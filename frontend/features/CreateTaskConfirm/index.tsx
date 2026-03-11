"use client";

import { Box, Backdrop, Typography, Button, Snackbar, Alert, CircularProgress } from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegisterTask } from "./hooks";
import { priorityMap } from "./constants";
import { useFetchGoal } from "./useFetchGoal";
import { useFetchDraftTask } from "./useFetchDraftTask";

type GoalIdProps = {
  goalId: number;
  draftTaskId: number;
};

export const CreateTaskConfirm = ({ goalId, draftTaskId }: GoalIdProps): React.JSX.Element => {
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
        <Box
          sx={{
            minHeight: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            px: 2,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 600, pb: 4 }}>
            <Typography
              variant="h4"
              component="p"
              sx={{ fontWeight: "bold", mt: 8, textAlign: "center" }}
            >
              確認
            </Typography>

            <Box sx={{ padding: 2, width: "100%" }}>
              <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 5 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  目標内容
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #eee",
                    borderRadius: 2,
                    p: 3,
                    mb: 4,
                  }}
                >
                  <Typography
                    sx={{
                      mb: 2,
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      borderBottom: "1px solid #ddd",
                      pb: 1,
                    }}
                  >
                    目標内容
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <strong>タイトル：</strong>
                    {goal?.title}
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <strong>期限：</strong>
                    {goal?.due_date}
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <strong>説明：</strong>
                    {goal?.description}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: "1px solid #eee",
                    borderRadius: 2,
                    p: 3,
                  }}
                >
                  <Typography
                    sx={{
                      mb: 2,
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      borderBottom: "1px solid",
                      pb: 1,
                    }}
                  >
                    登録するタスク
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <strong>タイトル：</strong>
                    {draftTask?.title}
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <strong>内容：</strong>
                    {draftTask?.content}
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    <strong>優先度：</strong>
                    {draftTask?.priority && priorityMap[draftTask?.priority]}
                  </Typography>
                  <Typography sx={{ mb: 2 }}>
                    <strong>期限：</strong>
                    {draftTask?.due_date}
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Typography sx={{ fontWeight: 600, mb: 1 }}>
                      {draftTask?.units?.[0]?.course.level_name}レベル
                      {draftTask?.units?.[0]?.course.level_number}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {draftTask?.units.map((unit) => (
                        <Box
                          key={unit.id}
                          sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: 10,
                            backgroundColor: "#e3f2fd",
                            fontSize: 14,
                          }}
                        >
                          {unit.unit_name}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box sx={{ my: 4, display: "flex", gap: 2 }}>
              <Button
                type="button"
                onClick={() => router.push(`/goals/${goalId}/tasks/new?draftTaskId=${draftTaskId}`)}
                sx={{
                  flex: 1,
                  backgroundColor: "#eee",
                  color: "#333",
                  p: 2,
                  fontSize: "large",
                  "&:hover": {
                    backgroundColor: "#ddd",
                  },
                }}
              >
                <Typography sx={{ fontSize: "large", textAlign: "center" }}>
                  キャンセル
                </Typography>
              </Button>

              <Button
                type="submit"
                sx={{
                  flex: 1,
                  backgroundColor: "#0068b7",
                  color: "#ffffff",
                  p: 2,
                  fontSize: "large",
                  "&:hover": {
                    backgroundColor: "#0055a3",
                  },
                }}
                onClick={handleRegister}
              >
                <Typography sx={{ fontSize: "large", textAlign: "center" }}>
                  登録する
                </Typography>
              </Button>
            </Box>
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
        <Backdrop open={isLoading} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, }}>
          <Box
            sx={{
              bgcolor: "background.paper",
              p: 4,
              borderRadius: 2,
              boxShadow: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size="4rem" />
          </Box>
        </Backdrop>
    </>
  );
};
