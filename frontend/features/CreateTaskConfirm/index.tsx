
'use client'

import { Box, Typography } from '@mui/material';

export const CreateTaskConfirm = (): React.JSX.Element => {

  const goal = {
    title: "英語の基礎を固める",
    description: "文法と単語を毎日コツコツ学習する",
    due_date: "2026-03-31",
  };

  const task = {
    title: "現在完了の復習",
    content: "問題集 p45〜p50 を解く",
    priority: "高",
    due_date: "2026-02-20",
  };

  const selectedUnits = [
    { id: 1, name: "現在完了" },
    { id: 2, name: "不規則動詞" },
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
        <Typography
          variant="h4"
          component="p"
          sx={{ fontWeight: "bold", mt: 4, textAlign: "center" }}
        >
          タスク作成確認
        </Typography>

        <Box sx={{ padding: 2, width: "100%" }}>
          <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 5 }}>

            <Box
              sx={{
                border: "1px solid #eee",
                borderRadius: 2,
                p: 3,
                mb: 4,
                backgroundColor: "#fafafa",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                目標
              </Typography>

              <Typography sx={{ mb: 1 }}>
                タイトル：{goal.title}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                説明：{goal.description}
              </Typography>

              <Typography>
                期限：{goal.due_date}
              </Typography>
            </Box>

            <Box
              sx={{
                border: "1px solid #eee",
                borderRadius: 2,
                p: 3,
                backgroundColor: "#fafafa",
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                タスク
              </Typography>

              <Typography sx={{ mb: 1 }}>
                タイトル：{task.title}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                内容：{task.content}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                優先度：{task.priority}
              </Typography>

              <Typography sx={{ mb: 2 }}>
                期限：{task.due_date}
              </Typography>

              <Typography sx={{ mb: 1, fontWeight: 500 }}>
                単元
              </Typography>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {selectedUnits.map((unit) => (
                  <Box
                    key={unit.id}
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: 10,
                      backgroundColor: "#e3f2fd",
                      fontSize: 14,
                    }}
                  >
                    {unit.name}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
