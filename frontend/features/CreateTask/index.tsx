"use client";

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
import { CreateTaskForm } from "./types";
import { SubjectName } from "@/features/CreateTask/subject";
import { useCourses } from "./hooks/useCourses";
import { priorities, PRIORITY, subjectLists } from "./constants";
import { useUnitSelection } from "./unitSelection";
import { useFetchDraftTask } from "../CreateTaskConfirm/useFetchDraftTask";
import { useEffect } from "react";

type Props = {
  goalId: number;
  draftTaskId: number;
};

export const CreateTask = ({ goalId, draftTaskId }: Props): React.JSX.Element => {
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

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskForm>({
    defaultValues: {
      goal_id: goalId,
      title: "",
      content: "",
      priority: PRIORITY.NORMAL,
      due_date: null,
      unit_ids: [],
    },
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
          タスク作成
        </Typography>
        <Box sx={{ padding: 2, width: "100%" }}>
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
                <Typography>期限</Typography>
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
            <Box
              sx={{
                mt: 4,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid #e0e0e0",
              }}
            >
              <Box
                sx={{
                  backgroundColor: "#0068b7",
                  color: "#ffffff",
                  px: 3,
                  py: 2,
                }}
              >
                <Typography sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                  講座を選択
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Typography sx={{ mb: 1, fontWeight: 500 }}>
                  教科選択
                </Typography>

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
                  sx={{
                    backgroundColor: "#fff",
                  }}
                >
                  <MenuItem value="">選択してください</MenuItem>
                  {subjectLists.map((subject, i) => (
                    <MenuItem key={i} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ p: 3, mb: 3 }}>
                <Typography sx={{ mb: 1, fontWeight: 500 }}>
                  講座一覧
                </Typography>
                {displayedCourses?.map((course) => (
                  <Card sx={{ mt: 2 }} key={course.id}>
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
                        onClick={() => setSelectedCourseId(course.id)}
                        sx={{
                          backgroundColor: "#0068b7",
                          color: "#ffffff",
                          fontSize: "small",
                        }}
                      >
                        詳細を見る
                      </Button>
                    </CardActions>
                  </Card>
                ))}
                {courses && courses.length > 3 && (
                  <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Button
                      onClick={() => setShowAllCourses((prev) => !prev)}
                      sx={{ color: "#0068b7" }}
                    >
                      {showAllCourses ? "閉じる" : "もっと見る"}
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
            {selectedCourseId && (
              <Box
                sx={{
                  mt: 4,
                  borderRadius: 2,
                  overflow: "hidden",
                  border: "1px solid #e0e0e0",
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "#0068b7",
                    color: "#ffffff",
                    px: 3,
                    py: 2,
                  }}
                >
                  <Typography sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    講座詳細
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedCourse?.level_name}レベル
                    {selectedCourse?.level_number}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {selectedCourse?.description ?? "説明はありません"}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
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
                </Box>
              </Box>
            )}
            <Box sx={{ my: 4, display: "flex", gap: 2 }}>
              <Button
                type="button"
                href="/"
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
                  後で作成する
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
                }}
              >
                <Typography sx={{ fontSize: "large", textAlign: "center" }}>
                  次へ
                </Typography>
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
