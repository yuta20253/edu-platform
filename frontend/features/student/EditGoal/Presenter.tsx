"use client";

import {
  Control,
  Controller,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form";
import { EditGoalForm, Goal } from "./types";
import {
  Alert,
  Box,
  Button,
  Chip,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { TaskStatus } from "@/types/tasks/status";
import { statusLabel } from "@/constants/status";

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

const fieldLabelSx = { fontSize: 13, fontWeight: 600, mb: 0.75 } as const;

type Props = {
  goal: Goal;
  register: UseFormRegister<EditGoalForm>;
  control: Control<EditGoalForm>;
  errors: FieldErrors<EditGoalForm>;
  handleSubmit: UseFormHandleSubmit<EditGoalForm>;
  onSubmit: (data: EditGoalForm) => void;
  toast: {
    open: boolean;
    message: string;
    severity: "success" | "error";
  };
  closeToast: () => void;
};

export const Presenter = ({
  goal,
  register,
  control,
  errors,
  handleSubmit,
  onSubmit,
  toast,
  closeToast,
}: Props) => {
  const tasks = goal.tasks ?? [];

  return (
    <>
      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <Link href={`/goals/${goal.id}`} style={{ textDecoration: "none" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
              mb: 2,
              "&:hover": { color: "primary.main" },
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
            <Typography sx={{ fontSize: 13 }}>目標詳細へ戻る</Typography>
          </Box>
        </Link>

        <Typography variant="h5" component="h1" sx={{ fontWeight: 800, mb: 3 }}>
          目標を編集
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <Box>
            <Typography sx={fieldLabelSx}>目標名</Typography>
            <TextField
              fullWidth
              defaultValue={goal.title}
              {...register("title", {
                required: "目標名を入力してください",
              })}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          </Box>

          <Box>
            <Typography sx={fieldLabelSx}>期限</Typography>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={ja}
            >
              <Controller
                name="due_date"
                control={control}
                rules={{
                  required: "期限を選択してください",
                }}
                defaultValue={goal.due_date ? new Date(goal.due_date) : null}
                render={({ field }) => (
                  <DatePicker
                    format="yyyy/MM/dd"
                    value={field.value || null}
                    onChange={(date) => field.onChange(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.due_date,
                        helperText: errors.due_date?.message,
                      },
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </Box>

          <Box>
            <Typography sx={fieldLabelSx}>説明</Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              defaultValue={goal.description ?? ""}
              {...register("description")}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
            <Button
              component={Link}
              href={`/goals/${goal.id}`}
              variant="outlined"
              fullWidth
            >
              キャンセル
            </Button>
            <Button type="submit" variant="contained" fullWidth>
              保存する
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              紐づくタスク
            </Typography>
            <Button
              component={Link}
              href={`/goals/${goal.id}/tasks/new`}
              variant="outlined"
              size="small"
            >
              タスク追加
            </Button>
          </Box>

          {tasks.length === 0 ? (
            <Box
              sx={{
                ...cardSx,
                p: 3,
                textAlign: "center",
                fontSize: 13,
                color: "text.secondary",
              }}
            >
              タスクはまだありません
            </Box>
          ) : (
            <Box sx={{ ...cardSx, px: 2 }}>
              {tasks.map((task, index) => {
                const statusColor = colors.statusUi[task.status as TaskStatus];

                return (
                  <Box
                    key={task.id}
                    component={Link}
                    href={`/goals/${goal.id}/tasks/${task.id}`}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1.5,
                      py: 1.5,
                      borderBottom:
                        index === tasks.length - 1
                          ? "none"
                          : `1px solid ${colors.border.light}`,
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                        {task.title}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 11, color: "text.secondary", mt: 0.25 }}
                      >
                        期限 {task.due_date}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={statusLabel[task.status as TaskStatus]}
                      sx={{
                        bgcolor: statusColor.bg,
                        color: statusColor.text,
                        flex: "none",
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={closeToast}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Alert
          onClose={closeToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};
