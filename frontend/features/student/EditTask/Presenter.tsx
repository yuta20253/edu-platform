"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
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
import { priorities, subjectLists } from "./constants";
import Link from "next/link";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { FormLabel, FormSection } from "@/components/StudentForm";
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
          <FormLabel>タスクタイトル</FormLabel>
          <TextField
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
          <FormLabel>タスク内容</FormLabel>
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
            <FormLabel>優先度</FormLabel>
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
          <Box sx={{ flex: 1.5, minWidth: 0 }}>
            <FormLabel>期限</FormLabel>
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

        <FormSection title="講座を選択">
          <FormLabel>教科選択</FormLabel>
          <TextField
            select
            fullWidth
            defaultValue=""
            onChange={(e) => fetchCourse(e.target.value as SubjectName)}
            slotProps={{
              select: {
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: 48 * 4,
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="">選択してください</MenuItem>
            {subjectLists.map((subject, i) => (
              <MenuItem key={i} value={subject}>
                {subject}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ mt: 3 }}>
            <FormLabel>講座一覧</FormLabel>
            {displayedCourses?.map((course) => (
              <Card variant="outlined" sx={{ mt: 1.5 }} key={course.id}>
                <CardContent>
                  <Typography variant="h6" component="div" gutterBottom>
                    {course.level_name}レベル{course.level_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {course.description ?? "説明はありません"}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    詳細を見る
                  </Button>
                </CardActions>
              </Card>
            ))}
            {courses && courses.length > 3 && (
              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Button onClick={() => setShowAllCourses((prev) => !prev)}>
                  {showAllCourses ? "閉じる" : "もっと見る"}
                </Button>
              </Box>
            )}
          </Box>
        </FormSection>

        {selectedCourseId && (
          <FormSection title="講座詳細">
            <Typography variant="h6" gutterBottom>
              {selectedCourse?.level_name}レベル
              {selectedCourse?.level_number}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedCourse?.description ?? "説明はありません"}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              単元一覧
            </Typography>
            {selectedCourse?.units.map((unit) => (
              <FormControlLabel
                key={unit.id}
                control={
                  <Checkbox
                    checked={selectedUnitIds.includes(unit.id)}
                    disabled={startedUnitIds.has(unit.id)}
                    onChange={() => handleToggleUnit(unit.id)}
                  />
                }
                label={`${unit.unit_name}${startedUnitIds.has(unit.id) ? "（学習開始済み）" : ""}`}
                sx={{ display: "block" }}
              />
            ))}
          </FormSection>
        )}

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
