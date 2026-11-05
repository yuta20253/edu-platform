"use client";

import { colors } from "@/app/theme/colors";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Pagination,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { GoalsTab } from "./components/GoalsTab";
import { ProfileTab } from "./components/ProfileTab";
import { TasksTab } from "./components/TasksTab";
import { StudentDetailResult, StudentDetailTab } from "./types";

type Props = {
  tab: StudentDetailTab;
  data: StudentDetailResult;
  loading: boolean;
  error: boolean;
  page: number;
  onTabChange: (tab: StudentDetailTab) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
};

export const Presenter = ({
  tab,
  data,
  loading,
  error,
  page,
  onTabChange,
  onPageChange,
  onRetry,
}: Props) => {
  // プロフィールは生徒の情報をそのまま返し、目標・タスクは student に名前を持つ
  const student = data.tab === "profile" ? data.data : data.data.student;

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: colors.brand.primary,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {student.name.charAt(0)}
          </Avatar>

          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: colors.text.primary }}
          >
            {student.name}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            component={Link}
            href={`/teacher/interviews/new?student_id=${student.id}`}
            variant="contained"
            size="small"
            sx={{
              height: 32,
              px: 2,
              textTransform: "none",
            }}
          >
            面談を申請
          </Button>
          <Button
            component={Link}
            href="/teacher/students"
            variant="outlined"
            size="small"
            sx={{
              height: 32,
              px: 2,
              textTransform: "none",
            }}
          >
            一覧へ戻る
          </Button>
        </Box>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, value: StudentDetailTab) => onTabChange(value)}
        sx={{ mb: 3, borderBottom: `1px solid ${colors.border.light}` }}
      >
        <Tab label="プロフィール" value="profile" />
        <Tab label="目標" value="goals" />
        <Tab label="タスク" value="tasks" />
      </Tabs>

      {error ? (
        // ErrorState の余白(p: 3)を打ち消し、タブの下に収める
        <Box sx={{ mx: -3, mt: -3 }}>
          <ErrorState onRetry={onRetry} />
        </Box>
      ) : loading || data.tab !== tab ? (
        // タブを押してから取得が始まるまでの間も、前のタブの内容を出さない
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : data.tab === "profile" ? (
        <ProfileTab student={data.data} />
      ) : data.tab === "goals" ? (
        <GoalsTab goals={data.data.goals} />
      ) : (
        <>
          <TasksTab
            tasks={data.data.tasks}
            totalCount={data.data.meta.total_count}
          />

          {data.data.meta.total_pages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={data.data.meta.total_pages}
                page={page}
                onChange={(_, value) => onPageChange(value)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
