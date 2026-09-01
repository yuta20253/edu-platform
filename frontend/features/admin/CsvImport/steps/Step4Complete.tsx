"use client";

import { Box, Button, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Link from "next/link";
import { colors } from "@/app/theme/colors";

type Props = {
  courseId: number;
  unitId: number;
  message: string;
  validCount: number;
  totalCount: number;
};

export const Step4Complete = ({
  courseId,
  unitId,
  message,
  validCount,
  totalCount,
}: Props) => {
  const unitDetailHref = `/admin/courses/${courseId}/units/${unitId}`;

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
        結果はインポート履歴で確認できます（反映まで数分かかる場合があります）
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button component={Link} href={unitDetailHref} variant="contained">
          単元詳細に戻る
        </Button>
        <Button component={Link} href={unitDetailHref} variant="outlined">
          インポート履歴を見る
        </Button>
      </Stack>
    </Box>
  );
};
