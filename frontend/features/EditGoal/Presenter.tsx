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
  Card,
  CardContent,
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
import { TaskStatus } from "@/types/tasks/status";
import { statusLabel } from "@/constants/status";

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
  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            my: 4,
            textAlign: "center",
          }}
        >
          目標編集
        </Typography>

        <Box sx={{ textAlign: "start", mb: 3 }}>
          <Link href={`/goals/${goal.id}`} style={{ textDecoration: "none" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
                cursor: "pointer",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: 14 }}>目標詳細へ戻る</Typography>
            </Box>
          </Link>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Card
            sx={{
              width: "min(720px, 90vw)",
              borderRadius: 3,
              boxShadow: 2,
            }}
          >
            <CardContent
              sx={{
                p: 4,
                "&:last-child": {
                  pb: 4,
                },
              }}
            >
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: 20,
                    mb: 3,
                  }}
                >
                  {goal.title}
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ mb: 1 }}>目標名</Typography>

                  <TextField
                    fullWidth
                    variant="outlined"
                    defaultValue={goal.title}
                    {...register("title", {
                      required: "目標名を入力してください",
                    })}
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ mb: 1 }}>期限</Typography>

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
                      defaultValue={
                        goal.due_date ? new Date(goal.due_date) : null
                      }
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

                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ mb: 1 }}>目標詳細</Typography>

                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    variant="outlined"
                    defaultValue={goal.description ?? ""}
                    {...register("description")}
                  />
                </Box>

                <Box sx={{ textAlign: "end", mt: 4 }}>
                  <Button type="submit" variant="contained">
                    保存する
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box mt={4} display="flex" flexDirection="column" alignItems="center">
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: "bold",
            }}
          >
            タスク一覧
          </Typography>

          {!goal.tasks || goal.tasks.length === 0 ? (
            <Typography color="text.secondary">
              タスクはまだありません
            </Typography>
          ) : (
            goal.tasks.map((task) => {
              const statusColor = colors.statusUi[task.status as TaskStatus];

              return (
                <Card
                  key={task.id}
                  component={Link}
                  href={`/goals/${goal.id}/tasks/${task.id}`}
                  sx={{
                    width: "min(720px, 90vw)",
                    textDecoration: "none",
                    borderRadius: 3,
                    boxShadow: 1,
                    mb: 3,
                    transition: "0.2s",
                    "&:hover": {
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: 3,
                      "&:last-child": {
                        pb: 3,
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        mb: 1.5,
                        lineHeight: 1.5,
                      }}
                    >
                      {task.title}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "text.secondary",
                        }}
                      >
                        期限: {task.due_date}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 12,
                          px: 1,
                          py: 0.3,
                          borderRadius: 1,
                          bgcolor: statusColor.bg,
                          color: statusColor.text,
                        }}
                      >
                        {statusLabel[task.status as TaskStatus]}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })
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
