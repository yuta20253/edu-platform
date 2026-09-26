"use client";

import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

/** フォーム項目の見出しラベル(入力欄の上に置く) */
export const FormLabel = ({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element => (
  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.75 }}>
    {children}
  </Typography>
);

/** 見出し付きの白いカード。講座選択・確認画面の各ブロックに使う */
export const FormSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): React.JSX.Element => (
  <Box
    sx={{
      mt: 3,
      bgcolor: colors.surface.white,
      borderRadius: `${radius.md}px`,
      boxShadow: `0 1px 3px ${colors.shadow.footer}`,
      overflow: "hidden",
    }}
  >
    <Typography
      component="h2"
      sx={{
        px: 2.5,
        py: 1.5,
        fontSize: 15,
        fontWeight: 800,
        borderBottom: `1px solid ${colors.border.light}`,
      }}
    >
      {title}
    </Typography>
    <Box sx={{ p: 2.5 }}>{children}</Box>
  </Box>
);
