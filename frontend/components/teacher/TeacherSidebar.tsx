"use client";
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
import MenuBookIcon from "@mui/icons-material/MenuBook";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CampaignIcon from "@mui/icons-material/Campaign";
import BarChartIcon from "@mui/icons-material/BarChart";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiClient } from "@/libs/http/apiClient";
import { MeUser } from "@/types/common/me";

const navItems = [
  {
    label: "ダッシュボード",
    href: "/teacher/dashboard",
    icon: <DashboardIcon fontSize="small" />,
  },
  {
    label: "教員管理",
    href: "/teacher/teachers",
    icon: <PeopleIcon fontSize="small" />,
  },
  {
    label: "生徒管理",
    href: "/teacher/students",
    icon: <PeopleIcon fontSize="small" />,
  },
  {
    label: "学習管理",
    href: "/teacher/student-study",
    icon: <MenuBookIcon fontSize="small" />,
  },
  {
    label: "CSVインポート",
    href: "/teacher/csv-import",
    icon: <UploadFileIcon fontSize="small" />,
  },
  {
    label: "お知らせ",
    href: "/teacher/announcements",
    icon: <CampaignIcon fontSize="small" />,
  },
  {
    label: "分析・レポート",
    href: "/teacher/analytics",
    icon: <BarChartIcon fontSize="small" />,
  },
];

type Props = {
  user: MeUser;
};

export const TeacherSidebar = ({ user }: Props) => {
  const pathName = usePathname();
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
        bgcolor: "#1e293b",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #334155",
      }}
    >
      <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #334155" }}>
        <Typography
          sx={{
            color: "#f1f5f9",
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: 1,
          }}
        >
          EduTeacher
        </Typography>
      </Box>
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {navItems.map((item) => {
          const isActive = pathName === item.href;
          return (
            <ListItem
              key={item.href}
              component={Link}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              sx={
                isActive
                  ? {
                      bgcolor: "#1d4ed8",
                      color: "#ffffff",
                      borderRadius: 1,
                      mb: 0.5,
                      "& .MuiListItemIcon-root": { color: "#ffffff" },
                      "&:hover": { bgcolor: "#1e40af" },
                    }
                  : {
                      color: "#94a3b8",
                      borderRadius: 1,
                      mb: 0.5,
                      "&:hover": { bgcolor: "#334155", color: "#f1f5f9" },
                    }
              }
            >
              <ListItemIcon
                sx={{ minWidth: 36, color: isActive ? "#ffffff" : "#94a3b8" }}
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

      <Box sx={{ borderTop: "1px solid #334155", px: 2, py: 1.5 }}>
        <IconButton disabled sx={{ color: "#64748b", mb: 1 }}>
          <NotificationsIcon />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "#334155",
              fontSize: "0.875rem",
            }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Typography
            sx={{ color: "#cbd5e1", fontSize: "0.875rem", flex: 1 }}
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
            color: "#94a3b8",
            fontSize: "0.875rem",
            px: 1,
            py: 0.5,
            borderRadius: 1,
            "&:hover": { bgcolor: "#334155", color: "#f1f5f9" },
          }}
        >
          <LogoutIcon fontSize="small" />
          ログアウト
        </Box>
      </Box>
    </Box>
  );
};
