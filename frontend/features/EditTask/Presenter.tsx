"use client";

import {
  Alert,
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { EditTaskForm, Task } from "./types";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { priorities } from "./constants";
import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

type Props = {
  goalId?: number;
  task: Task;
  register: UseFormRegister<EditTaskForm>;
  control: Control<EditTaskForm>;
  errors: FieldErrors<EditTaskForm>;
  handleSubmit: UseFormHandleSubmit<EditTaskForm>;
  onSubmit: (data: EditTaskForm) => void;
  toast: {
    open: boolean;
    message: string;
    severity: "success" | "error";
  };
  closeToast: () => void;
};

export const Presenter = ({
  goalId,
  task,
  register,
  control,
  errors,
  handleSubmit,
  onSubmit,
  toast,
  closeToast,
}: Props) => {
  const backHref = goalId
    ? `/goals/${goalId}/tasks/${task.id}`
    : `/tasks/${task.id}`;
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        px: 2,
        py: 4,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 600, pb: 4 }}>
        <Typography
          variant="h4"
          component="p"
          sx={{ fontWeight: "bold", mt: 8, textAlign: "center" }}
        >
          タスク更新
        </Typography>
        <Box
          sx={{
            padding: 2,
            width: "100%",
          }}
        >
          <Box
            sx={{
              textAlign: "start",
              mb: 3,
            }}
          >
            <Link href={backHref} style={{ textDecoration: "none" }}>
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
                <Typography sx={{ fontSize: 14 }}>タスク詳細に戻る</Typography>
              </Box>
            </Link>
          </Box>
          <Box
            component="form"
            sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 5 }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <Box sx={{ mb: 2 }}>
              <Typography>タスクタイトル</Typography>
              <TextField
                fullWidth
                variant="outlined"
                defaultValue={task.title}
                {...register("title", {
                  required: "目標名を入力してください",
                })}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography>タスク内容</Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                defaultValue={task.content}
                {...register("content")}
              />
            </Box>
            <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography>優先度</Typography>
                <Controller
                  name="priority"
                  control={control}
                  rules={{ required: "優先度を選択してください" }}
                  defaultValue={String(task.priority)}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.priority}>
                      <Select
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {priorities.map((priority) => (
                          <MenuItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box sx={{ mb: 4, flex: 1, minWidth: 0 }}>
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
                    defaultValue={task.due_date}
                    render={({ field }) => (
                      <DatePicker
                        format="yyyy/MM/dd"
                        value={field.value ? new Date(field.value) : null}
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
                  ></Controller>
                </LocalizationProvider>
              </Box>
            </Box>

            <Box sx={{ textAlign: "end", mt: 4 }}>
              <Button type="submit" variant="contained">
                保存する
              </Button>
            </Box>
          </Box>
        </Box>

        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={closeToast}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={closeToast}
            severity={toast.severity}
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};
