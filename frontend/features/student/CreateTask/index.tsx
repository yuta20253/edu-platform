"use client";

import { CourseSelector } from "@/components/StudentForm/CourseSelector";
import { FormLabel } from "@/components/StudentForm";
import { PrimaryCta } from "@/components/PrimaryCta";
import {
  Box,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { useSubmit } from "./hooks/useSubmit";
import { useCourses } from "@/hooks/useCourses";
import { priorities, PRIORITY } from "./constants";
import { useUnitSelection } from "@/hooks/useUnitSelection";
import { useFetchDraftTask } from "../CreateTaskConfirm/useFetchDraftTask";
import { useEffect } from "react";
import { useDefaultValues } from "./hooks/useDefaultValues";

type Props = {
  goalId: number;
  draftTaskId: number;
};

export const CreateTask = ({
  goalId,
  draftTaskId,
}: Props): React.JSX.Element => {
  const { draftTask } = useFetchDraftTask(
    draftTaskId ? Number(draftTaskId) : null,
  );

  const {
    courses,
    selectedCourseId,
    showAllCourses,
    fetchCourse,
    selectedCourse,
    displayedCourses,
    setSelectedCourseId,
    setShowAllCourses,
  } = useCourses();

  const { selectedUnitIds, handleToggleUnit, setSelectedUnitIds } =
    useUnitSelection();

  const defaultValues = useDefaultValues({ draftTask, goalId });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  const { onSubmit } = useSubmit({ selectedUnitIds });

  useEffect(() => {
    if (!draftTask) return;

    const priority =
      typeof draftTask.priority === "number"
        ? draftTask.priority
        : PRIORITY.NORMAL;

    const unitIds = draftTask.units?.map((u) => u.id) ?? [];
    reset({
      goal_id: draftTask.goal_id,
      title: draftTask.title ?? "",
      content: draftTask.content ?? "",
      priority: priority,
      due_date: draftTask.due_date ? new Date(draftTask.due_date) : null,
      unit_ids: unitIds,
    });

    setSelectedUnitIds(unitIds);
  }, [draftTask, reset, setSelectedUnitIds]);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, mt: 1, mb: 3 }}
      >
        タスク作成
      </Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ mb: 2 }}>
          <FormLabel htmlFor="task-title">タスクタイトル</FormLabel>
          <TextField
            id="task-title"
            fullWidth
            variant="outlined"
            {...register("title", {
              required: "目標名を入力してください",
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
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.priority}>
                  <Select
                    {...field}
                    labelId="task-priority-label"
                    onChange={(e) => field.onChange(Number(e.target.value))}
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
                rules={{ required: "期限を選択してください" }}
                render={({ field }) => (
                  <DatePicker
                    format="yyyy/MM/dd"
                    value={field.value || null}
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
          setShowAllCourses={setShowAllCourses}
          selectedUnitIds={selectedUnitIds}
          handleToggleUnit={handleToggleUnit}
        />

        <Box sx={{ mt: 4, mb: 2, display: "flex", gap: 1.25 }}>
          <PrimaryCta variant="outlined" href="/" sx={{ flex: 1 }}>
            後で作成する
          </PrimaryCta>
          <PrimaryCta type="submit" sx={{ flex: 1 }}>
            次へ
          </PrimaryCta>
        </Box>
      </Box>
    </Box>
  );
};
