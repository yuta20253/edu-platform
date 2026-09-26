"use client";

import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import HomeIcon from "@mui/icons-material/Home";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import PersonIcon from "@mui/icons-material/Person";
import Link from "next/link";

const items = [
  { label: "ホーム", icon: <HomeIcon />, href: "/" },
  { label: "タスク", icon: <FormatListBulletedIcon />, href: "/tasks" },
  { label: "進捗", icon: <AutoGraphIcon />, href: "/analytics" },
  { label: "カレンダー", icon: <CalendarMonthIcon />, href: "#" },
  { label: "プロフィール", icon: <PersonIcon />, href: "/profile" },
];

export const Footer = (): React.JSX.Element => {
  const pathName = usePathname();
  const hidden =
    pathName === "/login" ||
    pathName.endsWith("/signup") ||
    pathName.startsWith("/password/reset");

  if (hidden) return <></>;

  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        bgcolor: colors.surface.white,
        borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
        boxShadow: `0 -4px 16px ${colors.shadow.footer}`,
        display: "flex",
        zIndex: 9999,
      }}
    >
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathName === "/"
            : item.href !== "#" && pathName.startsWith(item.href);
        return (
          <Box
            key={item.label}
            component={Link}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              pt: 1.25,
              pb: 1.5,
              color: isActive ? "primary.main" : "text.primary",
              textDecoration: "none",
              "&:hover": { color: "primary.main" },
            }}
          >
            {item.icon}
            <Box sx={{ fontSize: 10, fontWeight: 600 }}>{item.label}</Box>
          </Box>
        );
      })}
    </Box>
  );
};
