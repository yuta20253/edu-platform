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
import Link from "next/link";
import { TeacherDashboardData } from "./types";
import { format } from "date-fns";

type Props = {
  data: TeacherDashboardData;
};

const kpiCards = (stats: TeacherDashboardData["stats"]) => [
  {
    label: "高１生",
    value: stats.grade_one_students_count,
    icon: <PeopleIcon />,
    color: "#2563eb",
  },
  {
    label: "高２生",
    value: stats.grade_two_students_count,
    icon: <PeopleIcon />,
    color: "#2563eb",
  },
  {
    label: "高３生",
    value: stats.grade_three_students_count,
    icon: <PeopleIcon />,
    color: "#2563eb",
  },
];

export const Presenter = ({ data }: Props) => {
  const { stats, announcements } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ mb: 3, color: "#0f172a" }}
      >
        ダッシュボード
      </Typography>
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
                  {card.value}人
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 3 }}>
        <Card
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
        >
          <CardContent>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              お知らせ
            </Typography>

            {announcements.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 2, textAlign: "center" }}
              >
                お知らせはありません
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>公開日</TableCell>
                    <TableCell>タイトル</TableCell>
                    <TableCell>ステータス</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {announcements.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {format(new Date(a.published_at), "yyyy/MM/dd")}
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontWeight: 500,
                        }}
                      >
                        {a.title}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={a.published_at ? "公開中" : "下書き"}
                          size="small"
                          sx={{
                            bgcolor: a.published_at ? "#22c55e" : "#64748b",
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
                href="/teacher/announcements/new"
                sx={{ justifyContent: "flex-start" }}
              >
                教員を追加する
              </Button>
              <Button
                variant="outlined"
                fullWidth
                component={Link}
                href="/teacher/announcements/new"
                sx={{ justifyContent: "flex-start" }}
              >
                お知らせを作成する
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
