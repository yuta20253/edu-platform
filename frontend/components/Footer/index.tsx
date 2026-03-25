"use client";

import { colors } from "@/app/theme/colors";
import { Box, useTheme } from "@mui/material";
import { usePathname } from "next/navigation";

export const Footer = (): React.JSX.Element => {
  const theme = useTheme();
  const pathName = usePathname();
  const hidden = pathName === "/login" || pathName.endsWith("/signup");
  const isAdmin = pathName.startsWith("/admin");

  if (hidden) return <></>;

  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 48,
        backgroundColor: isAdmin
          ? theme.palette.admin.main
          : theme.palette.primary.main,
        boxShadow: `0 -2px 8px ${colors.shadow.footer}`,
        display: "flex",
        justifyContent: "center",
        px: 4,
        zIndex: 9999,
      }}
    ></Box>
  );
};
