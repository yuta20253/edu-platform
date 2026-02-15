"use client";

import { Box, Typography, Button, Snackbar, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { TOKEN_KEY } from "@context/AuthContext";

type UnitType = {
  id: number;
  course_id: number;
  unit_name: string;
};

type CourseType = {
  id: number;
  level_number: number;
  level_name: string;
  description: string;
  units: UnitType[];
};

type GoalType = {
  title: string;
  description: string;
  formatted_due_date: string;
};

export const CreateTaskConfirm = (): React.JSX.Element => {
  const [goal, setGoal] = useState<GoalType | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const router = useRouter();

  const stored = sessionStorage.getItem("CreateTaskData");
  const parsed = stored ? JSON.parse(stored) : null;

  const form = parsed.form ?? {};
  const courses: CourseType[] = parsed?.courses ?? [];
  const task = parsed?.form?.task ?? {};
  const selectedUnitIds = form?.task.unit_ids ?? [];

  const groupedUnits = courses
    .map((course: CourseType) => ({
      courseId: course.id,
      courseName: course.level_name,
      levelNumber: course.level_number,
      units: course.units.filter((unit: UnitType) =>
        selectedUnitIds.includes(unit.id),
      ),
    }))
    .filter((course) => course.units.length > 0);

  const priorityMap: Record<string, string> = {
    very_low: "とても低い",
    low: "低い",
    normal: "普通",
    high: "高い",
    very_high: "とても高い",
  };

  const params = useParams();
  const goalId = Number(params.goalId);

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const res = await apiClient.get(`/api/v1/student/goals/${goalId}`, {
          headers,
        });

        setGoal(res.data);
        console.log(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchGoal();
  }, [goalId]);

  const handleRegister = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log(task);
      await apiClient.post(`/api/v1/student/tasks`, { task }, { headers })

      setSnackbar({
        open: true,
        message: "タスクが登録されました！",
        severity: "success",
      });

      setTimeout(() => router.push('/'), 1000);

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
    setSnackbar((prev) => ({...prev, open: false}));
  };

  return (
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
          sx={{ fontWeight: "bold", mt: 4, textAlign: "center" }}
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
                {goal?.formatted_due_date}
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
                {task.title}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>内容：</strong>
                {task.content}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>優先度：</strong>
                {priorityMap[task.priority ?? "normal"]}
              </Typography>
              <Typography sx={{ mb: 2 }}>
                <strong>期限：</strong>
                {task.due_date}
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {groupedUnits.map((course) => (
                  <Box key={course.courseId}>
                    <Typography sx={{ fontWeight: 600, mb: 1 }}>
                      {course.courseName}レベル{course.levelNumber}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {course.units.map((unit) => (
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
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ my: 4, display: "flex", gap: 2 }}>
          <Button
            type="button"
            onClick={() => window.history.back()}
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
  );
};
