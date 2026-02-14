'use client'

import { Box, Button, TextField, Typography, MenuItem, Card, CardContent, CardActions, Divider, FormControlLabel, Checkbox } from '@mui/material';
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useState } from "react";
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { TOKEN_KEY } from '@context/AuthContext';
import { apiClient } from '@/libs/http/apiClient';

type CreateTaskForm = {
    task: {
        goal_id: number;
        title: string;
        content: string;
        priority: string;
        due_date: string;
        unit_ids: number[] | null;
    }
};

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

type SubjectName =
  | "英語"
  | "数学"
  | "現代文"
  | "古文"
  | "日本史"
  | "世界史"
  | "地理"
  | "物理"
  | "化学"
  | "生物"
  | "地学";

export const CreateTask = (): React.JSX.Element => {
    const [courses, setCourses] = useState<CourseType[] | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [showAllCourses, setShowAllCourses] = useState<boolean>(false);
    const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
    const params = useParams();
    const router = useRouter();

    const goalId = Number(params.goalId);

    const priorities = [
        { value: "very_low", label: "とても低い" },
        { value: "low", label: "低い" },
        { value: "normal", label: "普通" },
        { value: "high", label: "高い" },
        { value: "very_high", label: "とても高い" },
    ];
    const subjectLists: SubjectName[] = [
        '英語', '数学', '現代文', '古文', '日本史', '世界史', '地理', '物理', '化学', '生物', '地学'
    ];

    const selectSubject = async (name: SubjectName) => {
        setSelectedCourseId(null);
        setShowAllCourses(false);
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            };

            const res = await apiClient.get<CourseType[]>(`/api/v1/student/courses?subject=${name}`, { headers });

            setCourses(res.data);
        } catch (error) {
            console.error(error);
        }
    }

    const handleToggleUnit = (unitId: number) => {
        setSelectedUnitIds((prev) =>
            prev?.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
        );
    };

    const selectedCourse = courses?.find((c) => c.id === selectedCourseId) ?? null;

    const displayedCourses = showAllCourses ? courses : courses?.slice(0, 3);

    const { control, register, handleSubmit, formState: { errors } }
        = useForm<CreateTaskForm>({
        defaultValues: {
            task: {
                goal_id: goalId,
                title: "",
                content: "",
                priority: "",
                due_date: "",
                unit_ids: []
            }
        }
  });

    const onSubmit: SubmitHandler<CreateTaskForm> = async (data) => {
        data.task.unit_ids = selectedUnitIds;
        sessionStorage.setItem("CreateTaskData", JSON.stringify(data));
        router.push(`/goals/${goalId}/tasks/confirm`);
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
            <Box sx={{ width: "100%", maxWidth: 600 }}>
                <Typography variant="h4" component="p" sx={{ fontWeight: "bold", mt: 4, textAlign: "center" }}>
                    タスク作成
                </Typography>
                <Box sx={{ padding: 2, width: "100%" }}>
                    <Box component="form" sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 5 }} onSubmit={handleSubmit(onSubmit)}>
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
                                    name='task.priority'
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
                                                <MenuItem key={priority.value} value={priority.value} >
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
                                <Typography sx={{mb: 1, fontWeight: 500}}>
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
                                        {selectedCourse?.level_name}レベル{selectedCourse?.level_number}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {selectedCourse?.description ?? "説明はありません"}
                                    </Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
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
                                        sx={{ display: 'block' }}
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
