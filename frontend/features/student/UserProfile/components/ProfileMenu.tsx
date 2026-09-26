"use client";

import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { apiClient } from "@/libs/http/apiClient";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, ButtonBase } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JSX } from "react";

const rowSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  px: 2,
  py: 1.75,
  fontSize: 14,
  textAlign: "left",
  borderBottom: `1px solid ${colors.border.light}`,
} as const;

export const ProfileMenu = (): JSX.Element => {
  const router = useRouter();

  const handleLogout = async () => {
    await apiClient.post("/api/auth/logout");
    router.push("/login");
    router.refresh();
  };

  return (
    <Box
      component="nav"
      aria-label="メニュー"
      sx={{
        bgcolor: colors.surface.white,
        borderRadius: `${radius.md}px`,
        overflow: "hidden",
        mt: 3,
      }}
    >
      <ButtonBase component={Link} href="/announcements" sx={rowSx}>
        お知らせ
        <ChevronRightIcon fontSize="small" />
      </ButtonBase>
      <ButtonBase
        onClick={handleLogout}
        sx={{ ...rowSx, color: "primary.dark", borderBottom: "none" }}
      >
        ログアウト
      </ButtonBase>
    </Box>
  );
};
