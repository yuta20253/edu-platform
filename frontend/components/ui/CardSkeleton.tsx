"use client";

import { colors } from "@/app/theme/colors";
import { Card, CardContent, Skeleton, Stack } from "@mui/material";

type Props = {
  lines?: number;
};

// カード形式の一覧・詳細のローディング表示。1行目はタイトル相当で
// 短め、それ以降は本文相当でフル幅にする。
export const CardSkeleton = ({ lines = 3 }: Props) => (
  <Card
    elevation={0}
    sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
  >
    <CardContent>
      <Stack spacing={1.5}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            height={24}
            width={index === 0 ? "40%" : "100%"}
          />
        ))}
      </Stack>
    </CardContent>
  </Card>
);
