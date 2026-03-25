"use client";

import { colors } from "@/app/theme/colors";
import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CampaignIcon from "@mui/icons-material/Campaign";
import BarChartIcon from "@mui/icons-material/BarChart";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MeUser } from "@/libs/server/me";
import { apiClient } from "@/libs/http/apiClient";

const navItems = [
  {
    label: "ダッシュボード",
    href: "/admin/dashboard",
    icon: <DashboardIcon fontSize="small" />,
  },
  {
    label: "管理者",
    href: "/admin/admins",
    icon: <PeopleIcon fontSize="small" />,
  },
  {
    label: "高校管理",
    href: "/admin/schools",
    icon: <SchoolIcon fontSize="small" />,
  },
  {
    label: "講座管理",
    href: "/admin/courses",
    icon: <MenuBookIcon fontSize="small" />,
  },
  {
    label: "CSVインポート",
    href: "/admin/csv-import",
    icon: <UploadFileIcon fontSize="small" />,
  },
  {
    label: "お知らせ",
    href: "/admin/notices",
    icon: <CampaignIcon fontSize="small" />,
  },
  {
    label: "分析・レポート",
    href: "/admin/analytics",
    icon: <BarChartIcon fontSize="small" />,
  },
];

type Props = {
  user: MeUser;
};

export const AdminSidebar = ({ user }: Props) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await apiClient.post("/api/auth/logout");
    router.push("/login");
  };

  return (
    <Box
      component="nav"
      sx={{
        width: 240,
        minWidth: 240,
        height: "100vh",
        bgcolor: colors.sidebar.background,
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${colors.sidebar.border}`,
      }}
    >
      {/* ロゴ */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${colors.sidebar.border}` }}>
        <Typography
          sx={{
            color: colors.sidebar.text,
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: 1,
          }}
        >
          EduAdmin
        </Typography>
      </Box>

      {/* ナビゲーション */}
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <ListItem
              key={item.href}
              component={Link}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              sx={
                isActive
                  ? {
                      bgcolor: colors.sidebar.active,
                      color: colors.text.inverse,
                      borderRadius: 1,
                      mb: 0.5,
                      "& .MuiListItemIcon-root": { color: colors.text.inverse },
                      "&:hover": { bgcolor: colors.sidebar.active },
                    }
                  : {
                      color: colors.sidebar.textSecondary,
                      borderRadius: 1,
                      mb: 0.5,
                      "&:hover": { bgcolor: colors.sidebar.hover, color: colors.sidebar.text },
                    }
              }
            >
              <ListItemIcon
                sx={{ minWidth: 36, color: isActive ? colors.text.inverse : colors.sidebar.textSecondary }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: "0.875rem" }}
              />
            </ListItem>
          );
        })}
      </List>

      {/* 下部エリア */}
      <Box sx={{ borderTop: `1px solid ${colors.sidebar.border}`, px: 2, py: 1.5 }}>
        <IconButton disabled sx={{ color: colors.sidebar.textMuted, mb: 1 }}>
          <NotificationsIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: colors.sidebar.avatar,
              fontSize: "0.875rem",
            }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Typography
            sx={{ color: colors.sidebar.textBody, fontSize: "0.875rem", flex: 1 }}
            noWrap
          >
            {user.name}
          </Typography>
        </Box>
        <Box
          component="button"
          onClick={handleLogout}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: colors.sidebar.textSecondary,
            fontSize: "0.875rem",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            "&:hover": { bgcolor: colors.sidebar.hover, color: colors.sidebar.text },
          }}
        >
          <LogoutIcon fontSize="small" />
          ログアウト
        </Box>
      </Box>
    </Box>
  );
};
