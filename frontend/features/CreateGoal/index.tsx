'use client'

import { Box, TextField, Typography, Button } from "@mui/material";
import { useForm, SubmitHandler } from "react-hook-form";
import { useState } from "react";
import { apiClient } from "@/libs/http/apiClient";
import { TOKEN_KEY } from '@context/AuthContext';
import { useRouter } from "next/navigation";

type CreateGoalForm = {
    goal: {
        title: string;
        description: string;
        due_date: string;
    }
}


export const CreateGoal = (): React.JSX.Element => {
    const router = useRouter();
    const [dueDate, setDueDate] = useState<string>('');

    const { register, handleSubmit, formState: { errors } } = useForm<CreateGoalForm>();

    const onSubmit: SubmitHandler<CreateGoalForm> = async (data: CreateGoalForm) => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            };

            const res = await apiClient.post("/api/v1/student/goals", data, { headers })
            console.log(res.data);
            const goalId = res.data;

            router.push(`/goals/${goalId}/tasks/new`);
        } catch (error) {
            console.error("目標の作成に失敗しました。");
        }
    };

    return (
        <Box
            sx={{
                minHeight: "80vh",
                display: "flex",
                alignItems: "center",
                px: 2,
            }}
        >
            <Box sx={{ width: "100%", maxWidth: 600 }}>
                <Typography variant="h4" component="p" sx={{ fontWeight: "bold", mt: 4, textAlign: "center" }}>
                    目標設定
                </Typography>
                <Box sx={{ padding: 2, width: "100%" }}>
                    <Box component="form" sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 5 }} onSubmit={handleSubmit(onSubmit)}>
                        <Box sx={{ mb: 2 }}>
                            <Typography>目標名</Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                {...register("goal.title", {
                                required: "目標名を入力してください",
                                })}
                                error={!!errors.goal?.title}
                                helperText={errors.goal?.title?.message}
                            />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>目標詳細</Typography>
                            <TextField
                                multiline
                                rows={4}
                                fullWidth
                                variant="outlined"
                                {...register("goal.description")}
                            />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography>期限</Typography>
                            <TextField
                                type="date"
                                variant="outlined"
                                value={dueDate}
                                {...register("goal.due_date")}
                                onChange={(e) => setDueDate(e.target.value)}
                                slotProps={{
                                    inputLabel: {
                                        shrink: true,
                                    },
                                }}
                            />
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
    )
};
