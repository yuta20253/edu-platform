"use client";

import { FormLabel, FormSection } from "@/components/StudentForm";
import { PrimaryCta } from "@/components/PrimaryCta";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Divider,
  FormControlLabel,
  Checkbox,
  Select,
  FormControl,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ja } from "date-fns/locale";
import { useSubmit } from "./hooks/useSubmit";
import { SubjectName } from "@/constants/subject";
import { useCourses } from "@/hooks/useCourses";
import { priorities, PRIORITY, subjectLists } from "./constants";
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
          <FormLabel>タスクタイトル</FormLabel>
          <TextField
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
          <FormLabel>タスク内容</FormLabel>
          <TextField
            multiline
            rows={4}
            fullWidth
            variant="outlined"
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
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.priority}>
                  <Select
                    {...field}
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
            <FormLabel>期限</FormLabel>
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
                    onChange={() => handleToggleUnit(unit.id)}
                  />
                }
                label={unit.unit_name}
                sx={{ display: "block" }}
              />
            ))}
          </FormSection>
        )}

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
