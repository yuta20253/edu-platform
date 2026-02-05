'use client';

import { apiClient } from "@/libs/http/apiClient";
import { Box } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { FaPen } from "react-icons/fa";

type GoalType = {
    id: number;
    title: string;
    description: string;
    formatted_status: string;
    formatted_due_date: string;
};

const TOKEN_KEY = 'token';

export const Home = (): React.JSX.Element => {
    const [goals, setGoals] = useState<GoalType[] | null>(null);

    useEffect(() => {
        const boot = async () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }

                const res = await apiClient.get(
                    '/api/v1/student/dashboard',
                    { headers }
                );

                setGoals(res.data);
            } catch (error) {
                console.error('目標一覧の取得に失敗しました。');
            }
        };

        boot();
    }, []);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Box sx={{ minHeight: '100vh', px: 2, pt: 20 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 60px', px: 1, py: 0.75, fontSize: 12}}>
                    <Box sx={{ borderLeft: '2px solid #bbb' }} textAlign="center">目標</Box>
                    <Box sx={{ borderLeft: '2px solid #bbb' }} textAlign="center">達成度</Box>
                    <Box sx={{ borderLeft: '2px solid #bbb' }} textAlign="center">期限</Box>
                    <Box textAlign="right"></Box>
                </Box>

                {goals?.map((goal) => (
                    <Box
                        key={goal.id}
                        sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 80px 90px 60px',
                        alignItems: 'center',
                        px: 1,
                        py: 0.75,
                        fontSize: 13,
                        }}
                    >
                        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {goal.title}
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            {goal.formatted_status}
                        </Box>
                        <Box sx={{ textAlign: 'center'}}>
                            {goal.formatted_due_date}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Link href={`/student/goals/${goal.id}/edit`}>
                                <FaPen size={14} />
                            </Link>
                            <FaRegTrashAlt size={14} />
                        </Box>
                    </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Link href={`/student/goals/create`} style={{ backgroundColor: '#0068b7',color: '#fff', padding: '8px 12px', borderRadius: 6, fontSize: 14, textDecoration: 'none', }}>
                        目標追加
                    </Link>
                </Box>
            </Box>
        </Box>
    );
};
