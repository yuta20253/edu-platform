"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import Link from "next/link";
import type { AdminCourseDetail } from "./types";

type Props = {
  course: AdminCourseDetail;
};

export const Presenter = ({ course }: Props) => {
  const courseLabel = `${course.level_name}レベル${course.level_number}`;

  return (
    <Box sx={{ p: 3 }}>
      {/* パンくずナビ */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          href="/admin/courses"
          style={{ color: colors.brand.primary, textDecoration: "none" }}
        >
          講座一覧
        </Link>
        <Typography color="text.primary">{courseLabel}</Typography>
      </Breadcrumbs>

      {/* ページタイトル */}
      <Typography
        variant="h5"
        component="h1"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 3 }}
      >
        {courseLabel}
      </Typography>

      {/* 講座情報カード */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography
                variant="body2"
                sx={{ color: colors.text.muted, mb: 0.5 }}
              >
                科目
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {course.subject.name}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography
                variant="body2"
                sx={{ color: colors.text.muted, mb: 0.5 }}
              >
                レベル
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {courseLabel}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="body2"
                sx={{ color: colors.text.muted, mb: 0.5 }}
              >
                説明
              </Typography>
              {course.description ? (
                <Typography variant="body1">{course.description}</Typography>
              ) : (
                <Typography variant="body1" sx={{ color: colors.text.muted }}>
                  説明はありません
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 単元一覧 */}
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 1.5 }}
      >
        単元一覧
      </Typography>
      <Card
        elevation={0}
        sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {course.units.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography color="text.secondary">
                単元がまだありません
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.surface.light }}>
                    <TableCell sx={{ fontWeight: 600 }}>単元名</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      問題数
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      操作
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {course.units.map((unit) => (
                    <TableRow
                      key={unit.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="body2">
                            {unit.unit_name}
                          </Typography>
                          {/* 問題数0の単元は、何をすべきか管理者に明示する */}
                          {unit.questions_count === 0 && (
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: colors.status.warning,
                              }}
                            >
                              <WarningAmberOutlinedIcon fontSize="inherit" />
                              <Typography variant="caption">
                                CSVで問題を追加
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {unit.questions_count}
                      </TableCell>
                      <TableCell align="right">
                        {/*
                          CSVインポートウィザード(#P0-6)の想定遷移先。
                          単元プリセット込みのURL。ウィザード本体は別issueで実装予定。
                        */}
                        <Button
                          component={Link}
                          href={`/admin/courses/${course.id}/units/${unit.id}/import`}
                          size="small"
                          variant="outlined"
                          startIcon={<UploadFileOutlinedIcon />}
                        >
                          CSV取込
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
