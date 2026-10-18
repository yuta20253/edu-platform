import { Box, Typography } from "@mui/material";
import { ReactNode, useId } from "react";
import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";

export const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

type Props = {
  title: string;
  // 累計セクションの中に置くカードは h3 にする
  headingLevel?: "h2" | "h3";
  children: ReactNode;
};

export const DashboardCard = ({
  title,
  headingLevel = "h2",
  children,
}: Props) => {
  const titleId = useId();

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ ...cardSx, p: 2 }}>
      <Typography
        id={titleId}
        variant={headingLevel}
        sx={{ fontSize: 15, fontWeight: 800, mb: 1.5 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};
