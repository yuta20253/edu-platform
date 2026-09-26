"use client";

import {
  Alert,
  Box,
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
import { CourseSelector } from "@/components/StudentForm/CourseSelector";
import { FormLabel } from "@/components/StudentForm";
import { PrimaryCta } from "@/components/PrimaryCta";
import { SubjectName } from "@/constants/subject";
import { Dispatch, SetStateAction } from "react";
import { Course } from "@/types/tasks/course";

type Props = {
  goalId?: number;
  task: Task;
  courses: Course[] | null;
  selectedCourseId: number | null;
  showAllCourses: boolean;
  fetchCourse: (name: SubjectName) => Promise<void>;
  selectedCourse: Course | null;
  displayedCourses: Course[] | null | undefined;
  setSelectedCourseId: (value: number) => void;
  setShowAllCourses: Dispatch<SetStateAction<boolean>>;
  selectedUnitIds: number[];
  handleToggleUnit: (userId: number) => void;
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
  courses,
  selectedCourseId,
  showAllCourses,
  fetchCourse,
  selectedCourse,
  displayedCourses,
  setSelectedCourseId,
  setShowAllCourses,
  selectedUnitIds,
  handleToggleUnit,
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

  const startedUnitIds = new Set(
    task.units?.filter((u) => u.started).map((u) => u.id),
  );
  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Box
        component={Link}
        href={backHref}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          mt: 1,
          color: "text.secondary",
          fontSize: 14,
          "&:hover": { color: "primary.main" },
        }}
      >
        <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        タスク詳細に戻る
      </Box>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, mt: 1.5, mb: 3 }}
      >
        タスク更新
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ mb: 2 }}>
          <FormLabel htmlFor="task-title">タスクタイトル</FormLabel>
          <TextField
            id="task-title"
            fullWidth
            variant="outlined"
            defaultValue={task.title}
            {...register("title", {
              required: "タスク名を入力してください",
            })}
            error={!!errors.title}
            helperText={errors.title?.message}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <FormLabel htmlFor="task-content">タスク内容</FormLabel>
          <TextField
            id="task-content"
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
            <FormLabel id="task-priority-label">優先度</FormLabel>
            <Controller
              name="priority"
              control={control}
              rules={{ required: "優先度を選択してください" }}
              defaultValue={String(task.priority)}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.priority}>
                  <Select
                    {...field}
                    labelId="task-priority-label"
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
          <Box sx={{ flex: 1.5, minWidth: 0 }}>
            <FormLabel htmlFor="task-due-date">期限</FormLabel>
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
                defaultValue={task.due_date ? new Date(task.due_date) : null}
                render={({ field }) => (
                  <DatePicker
                    format="yyyy/MM/dd"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) => field.onChange(date)}
                    slotProps={{
                      textField: {
                        id: "task-due-date",
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
        </Box>

        <CourseSelector
          courses={courses}
          displayedCourses={displayedCourses}
          selectedCourse={selectedCourse}
          selectedCourseId={selectedCourseId}
          showAllCourses={showAllCourses}
          fetchCourse={fetchCourse}
          setSelectedCourseId={setSelectedCourseId}
          onToggleShowAll={() => setShowAllCourses((prev) => !prev)}
          selectedUnitIds={selectedUnitIds}
          handleToggleUnit={handleToggleUnit}
          startedUnitIds={startedUnitIds}
        />

        <Box sx={{ mt: 4, mb: 2, display: "flex", gap: 1.25 }}>
          <PrimaryCta variant="outlined" href={backHref} sx={{ flex: 1 }}>
            キャンセル
          </PrimaryCta>
          <PrimaryCta type="submit" sx={{ flex: 1 }}>
            保存する
          </PrimaryCta>
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
  );
};
