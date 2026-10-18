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
  children: ReactNode;
};

export const DashboardCard = ({ title, children }: Props) => {
  const titleId = useId();

  return (
    <Box component="section" aria-labelledby={titleId} sx={{ ...cardSx, p: 2 }}>
      <Typography
        id={titleId}
        variant="h2"
        sx={{ fontSize: 15, fontWeight: 800, mb: 1.5 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};
