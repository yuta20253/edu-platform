"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { GoalsTab } from "./components/GoalsTab";
import { ProfileTab } from "./components/ProfileTab";
import { StudentDetailResult, StudentDetailTab } from "./types";

type Props = {
  tab: StudentDetailTab;
  data: StudentDetailResult;
  loading: boolean;
  error: boolean;
  page: number;
  onTabChange: (tab: StudentDetailTab) => void;
  onPageChange: (page: number) => void;
};

export const Presenter = ({
  tab,
  data,
  loading,
  error,
  onTabChange,
}: Props) => {
  // プロフィールは生徒の情報をそのまま返し、目標・タスクは student に名前を持つ
  const studentName =
    data.tab === "profile" ? data.data.name : data.data.student.name;

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
        <Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: colors.text.primary }}
          >
            生徒詳細
          </Typography>

          <Typography variant="body1" sx={{ color: colors.text.secondary }}>
            {studentName}
          </Typography>
        </Box>

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
        <Typography
          variant="body2"
          sx={{ py: 6, textAlign: "center", color: colors.text.secondary }}
        >
          データの取得に失敗しました
        </Typography>
      ) : loading || data.tab !== tab ? (
        // タブを押してから取得が始まるまでの間も、前のタブの内容を出さない
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : data.tab === "profile" ? (
        <ProfileTab student={data.data} />
      ) : (
        data.tab === "goals" && <GoalsTab goals={data.data.goals} />
      )}
    </Box>
  );
};
