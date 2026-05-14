"use client";

import { colors } from "@/app/theme/colors";
import { Box, useTheme } from "@mui/material";
import { usePathname } from "next/navigation";
import HomeIcon from "@mui/icons-material/Home";
import TaskIcon from "@mui/icons-material/Task";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import PersonIcon from "@mui/icons-material/Person";
import Link from "next/link";

export const Footer = (): React.JSX.Element => {
  const theme = useTheme();
  const pathName = usePathname();
  const hidden = pathName === "/login" || pathName.endsWith("/signup");
  const isAdmin = pathName.startsWith("/admin");

  const icons = [
    {
      label: "ホーム",
      icon: <HomeIcon />,
      href: "/",
    },
    {
      label: "タスク",
      icon: <TaskIcon />,
      href: "#",
    },
    {
      label: "カレンダー",
      icon: <CalendarMonthIcon />,
      href: "#",
    },
    {
      label: "学習進捗",
      icon: <AutoGraphIcon />,
      href: "#",
    },
    {
      label: "ユーザー",
      icon: <PersonIcon />,
      href: "/profile",
    },
  ];

  if (hidden) return <></>;

  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 56,
        backgroundColor: isAdmin
          ? theme.palette.admin.main
          : theme.palette.primary.main,
        boxShadow: `0 -2px 8px ${colors.shadow.footer}`,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        px: 2,
        zIndex: 9999,
      }}
    >
      {icons.map((item, i) => (
        <Box
          key={i}
          component={Link}
          href={item.href}
          sx={{
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 48,
            fontSize: 10,
            textDecoration: "none",
          }}
        >
          {item.icon}
          <Box sx={{ fontSize: 10 }}>{item.label}</Box>
        </Box>
      ))}
    </Box>
  );
};
