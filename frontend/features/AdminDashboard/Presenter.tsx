"use client";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { AdminDashboardData, ImportStatus } from "./types";

type Props = {
  data: AdminDashboardData;
};

const kpiCards = (stats: AdminDashboardData["stats"]) => [
  {
    label: "生徒数",
    value: stats.student_count,
    icon: <SchoolIcon />,
    color: "#2563eb",
  },
  {
    label: "教師数",
    value: stats.teacher_count,
    icon: <PeopleIcon />,
    color: "#7c3aed",
  },
  {
    label: "総問題数",
    value: stats.total_questions,
    icon: <QuizIcon />,
    color: "#d97706",
  },
  {
    label: "管理者数",
    value: stats.admin_count,
    icon: <AdminPanelSettingsIcon />,
    color: "#059669",
  },
];

const statusConfig: Record<ImportStatus, { label: string; color: string }> = {
  completed: { label: "完了", color: "#059669" },
  failed: { label: "失敗", color: "#dc2626" },
  processing: { label: "処理中", color: "#2563eb" },
  pending: { label: "待機中", color: "#64748b" },
};

export function AdminDashboardPresenter({ data }: Props) {
  const { stats, recent_imports } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ mb: 3, color: "#0f172a" }}
      >
        ダッシュボード
      </Typography>

      {/* KPI カード */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 2,
          mb: 4,
        }}
      >
        {kpiCards(stats).map((card) => (
          <Card
            key={card.label}
            elevation={0}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: card.color, width: 44, height: 44 }}>
                {card.icon}
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {card.value}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 3 }}>
        {/* CSVインポート履歴 */}
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              最近のCSVインポート
            </Typography>
            {recent_imports.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 2, textAlign: "center" }}
              >
                CSVインポート履歴がありません
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>実行日時</TableCell>
                    <TableCell>ファイル名</TableCell>
                    <TableCell>件数</TableCell>
                    <TableCell>ステータス</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recent_imports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {format(new Date(item.created_at), "yyyy/MM/dd HH:mm", {
                          locale: ja,
                        })}
                      </TableCell>
                      <TableCell
                        sx={{
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.file_name}
                      </TableCell>
                      <TableCell>
                        {item.success_count} / {item.total_count} 件
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig[item.status].label}
                          size="small"
                          sx={{
                            bgcolor: statusConfig[item.status].color,
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* クイックアクション */}
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              クイックアクション
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Button
                variant="outlined"
                fullWidth
                component={Link}
                href="/admin/csv-import"
                sx={{ justifyContent: "flex-start" }}
              >
                CSVインポートを実行する
              </Button>
              <Button
                variant="outlined"
                fullWidth
                component={Link}
                href="/admin/notices/new"
                sx={{ justifyContent: "flex-start" }}
              >
                お知らせを作成する
              </Button>
              <Button
                variant="outlined"
                fullWidth
                component={Link}
                href="/admin/admins/new"
                sx={{ justifyContent: "flex-start" }}
              >
                管理者を追加する
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
