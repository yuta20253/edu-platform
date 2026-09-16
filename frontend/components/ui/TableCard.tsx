"use client";

import { colors } from "@/app/theme/colors";
import { Card, CardContent } from "@mui/material";

type Props = {
  children: React.ReactNode;
};

// 管理画面のテーブルを包む共通のカード外枠。
// Card + CardContent の組み合わせが各画面で重複していたため切り出した。
export const TableCard = ({ children }: Props) => (
  <Card
    elevation={0}
    sx={{
      border: `1px solid ${colors.border.light}`,
      borderRadius: 2,
      mb: 3,
    }}
  >
    <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
      {children}
    </CardContent>
  </Card>
);
