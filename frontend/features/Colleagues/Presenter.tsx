"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { TeachersData } from "./types";

type Props = {
  data: TeachersData;
  page: number;
  onPageChange: (page: number) => void;
};

export const Presenter = ({ data, page, onPageChange }: Props) => {
  const { current_user, teachers, meta } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            gap: 1.5,
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: colors.text.primary }}
          >
            教員一覧
          </Typography>

          <Typography variant="body2" sx={{ color: colors.text.muted }}>
            {meta.total_count}件
          </Typography>
        </Box>

        {current_user.teacher_permission.manage_other_teachers && (
          <Box sx={{ display: "flex", gap: 1.5, ml: "auto" }}>
            <Button
              component={Link}
              href=""
              variant="outlined"
              size="small"
              sx={{
                minWidth: 110,
                height: 36,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              権限管理
            </Button>
            <Button
              component={Link}
              href=""
              variant="outlined"
              size="small"
              sx={{
                minWidth: 110,
                height: 36,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              新規登録
            </Button>
          </Box>
        )}
      </Box>
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          overflow: "hidden",
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <TableContainer>
            <Table
              size="small"
              sx={{
                "& th, & td": {
                  py: 1.5,
                  px: 2,
                  verticalAlign: "middle",
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: colors.surface.light,
                    "& th": {
                      fontWeight: 700,
                      color: colors.text.primary,
                      borderBottom: `1px solid ${colors.border.light}`,
                    },
                  }}
                >
                  <TableCell>氏名</TableCell>
                  <TableCell>氏名カナ</TableCell>
                  <TableCell>担当学年</TableCell>
                  <TableCell align="center">操作範囲</TableCell>
                  <TableCell align="center">他職員権限</TableCell>
                  <TableCell align="center">詳細</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow
                    key={teacher.id}
                    hover
                    sx={{
                      transition: "background-color 0.15s ease",
                      "&:last-child td": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      {teacher.name}
                    </TableCell>

                    <TableCell>{teacher.name_kana}</TableCell>

                    <TableCell>{teacher.grade.display_name}</TableCell>

                    <TableCell align="center">
                      <Chip
                        label={
                          teacher.teacher_permission.grade_scope
                            ? "自学年"
                            : "全学年"
                        }
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          minWidth: 72,
                          height: 24,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={
                          teacher.teacher_permission.manage_other_teachers
                            ? "有"
                            : "無"
                        }
                        size="small"
                        color={
                          teacher.teacher_permission.manage_other_teachers
                            ? "success"
                            : "default"
                        }
                        sx={{
                          minWidth: 48,
                          height: 24,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        component={Link}
                        href={`/teacher/colleagues/${teacher.id}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: 64,
                          height: 28,
                          px: 1.5,
                          fontSize: "0.75rem",
                          borderRadius: 1.5,
                          textTransform: "none",
                        }}
                      >
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {meta.total_pages > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Pagination
            count={meta.total_pages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
};
