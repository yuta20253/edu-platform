'use client'

import { Box, Button, TextField, Typography, MenuItem, Card, CardContent, CardActions, Divider, FormControlLabel, Checkbox } from '@mui/material';
import { useForm, SubmitHandler } from "react-hook-form";
import { useState } from "react";

type CreateTaskForm = {
    task: {
        goal_id: number;
        title: string;
        content: string;
        priority: number;
        due_date: string;
        unit_ids: number[] | null;
    }
};

export const CreateTask = (): React.JSX.Element => {
    const [dueDate, setDueDate] = useState<string>('');
    const { register, formState: { errors } } = useForm<CreateTaskForm>();

    const priorities = [
        { value: "very_low", label: "とても低い" },
        { value: "low", label: "低い" },
        { value: "normal", label: "普通" },
        { value: "high", label: "高い" },
        { value: "very_high", label: "とても高い" },
    ];
    const subjectLists = [
        '英語', '数学', '現代文', '古文', '日本史', '世界史', '地理', '物理', '化学', '生物', '地学'
    ];

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
                    <Box component="form" sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 5 }}>
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
                                <TextField
                                    select
                                    fullWidth
                                    {...register("task.priority")}
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
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography>期限</Typography>
                                <TextField
                                    type="date"
                                    variant="outlined"
                                    value={dueDate}
                                    {...register("task.due_date")}
                                    onChange={(e) => setDueDate(e.target.value)}
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
                                <Card sx={{ mt: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6" component="div" gutterBottom>
                                        講座名
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                        ここに講座の概要が入ります。ReactやRailsの基礎を学ぶ講座です。
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: "flex-end" }}>
                                        <Button
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
                                <Card sx={{ mt: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6" component="div" gutterBottom>
                                        講座名
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                        ここに講座の概要が入ります。ReactやRailsの基礎を学ぶ講座です。
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: "flex-end" }}>
                                        <Button
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
                                講座詳細
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                講座名: React & Rails入門
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                この講座では、ReactとRailsの基礎を学び、Webアプリ開発の全体像を理解します。
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                                到達イメージ
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                講座終了後は、簡単なフロント＋バックエンドのアプリを自力で作れるようになります。
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                単元一覧
                                </Typography>
                                {['React基礎', 'Rails入門', '状態管理'].map((unit, i) => (
                                <FormControlLabel
                                    key={i}
                                    control={<Checkbox />}
                                    label={unit}
                                    sx={{ display: 'block' }}
                                />
                                ))}
                            </Box>
                        </Box>
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
