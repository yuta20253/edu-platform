"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Link from "next/link";
import { colors } from "@/app/theme/colors";

type Props = {
  message: string;
  validCount: number;
  totalCount: number;
  onReset: () => void;
};

export const Step4Complete = ({
  message,
  validCount,
  totalCount,
  onReset,
}: Props) => {
  return (
    <Box sx={{ textAlign: "center", py: 4 }}>
      <CheckCircleOutlineIcon
        sx={{ fontSize: 48, color: colors.status.success, mb: 2 }}
      />
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        {message}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        検証時点の有効行数: {validCount} / {totalCount}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        インポート処理には数分かかる場合があります
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button component={Link} href="/teacher/students" variant="contained">
          生徒管理に戻る
        </Button>
        <Button onClick={onReset} variant="outlined">
          続けてインポートする
        </Button>
      </Stack>
    </Box>
  );
};
