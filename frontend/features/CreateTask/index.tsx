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
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useParams } from "next/navigation";
import { useSubmit } from "./hooks";
import { CreateTaskForm } from "@/types/task/new/form";
import { SubjectName } from "@/types/task/new/subject";
import { useCourses } from "./courses";
import { priorities, subjectLists } from "./constants";
import { useUnitSelection } from "./unitSelection";

export const CreateTask = (): React.JSX.Element => {
  const params = useParams();

  const goalId = Number(params.goalId);

  const { courses, selectedCourseId, showAllCourses, selectSubject, selectedCourse, displayedCourses, setSelectedCourseId, setShowAllCourses } = useCourses();

  const { selectedUnitIds, handleToggleUnit } = useUnitSelection();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTaskForm>({
    defaultValues: {
      task: {
        goal_id: goalId,
        title: "",
        content: "",
        priority: 3,
        due_date: "",
        unit_ids: [],
      },
    },
  });

  const { onSubmit } = useSubmit({ selectedUnitIds, courses, goalId  });

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
                {...register("task.title", {
                  required: "目標名を入力してください",
                })}
                error={!!errors.task?.title}
                helperText={errors.task?.title?.message}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography>タスク内容</Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                {...register("task.content")}
              />
            </Box>
            <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography>優先度</Typography>
                <Controller
                  name="task.priority"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      fullWidth
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={!!errors.task?.priority}
                      helperText={errors.task?.priority?.message}
                    >
                      <MenuItem value="">選択してください</MenuItem>
                      {priorities.map((priority) => (
                        <MenuItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography>期限</Typography>
                <TextField
                  type="date"
                  variant="outlined"
                  {...register("task.due_date")}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
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
                  onChange={(e) => selectSubject(e.target.value as SubjectName)}
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
            <Box sx={{ my: 4 }}>
              <Button
                type="submit"
                sx={{
                  width: "100%",
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
