"use client";

import { colors } from "@/app/theme/colors";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Pagination,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { UseFormReturn } from "react-hook-form";
import { PermissionEditDrawer } from "./components/PermissionEditDrawer";
import {
  PermissionTeacher,
  SnackbarState,
  TeacherPermissionsData,
  UpdatePermissionInput,
} from "./types";

type Props = {
  data: TeacherPermissionsData;
  page: number;
  onPageChange: (page: number) => void;
  editingTeacher: PermissionTeacher | null;
  onEditClick: (teacher: PermissionTeacher) => void;
  onDrawerClose: () => void;
  onUpdate: (input: UpdatePermissionInput) => void;
  updating: boolean;
  updateErrors: string[];
  snackbar: SnackbarState;
  onSnackbarClose: () => void;
  form: UseFormReturn<UpdatePermissionInput>;
};

export const Presenter = ({
  data,
  page,
  onPageChange,
  editingTeacher,
  onEditClick,
  onDrawerClose,
  onUpdate,
  updating,
  updateErrors,
  snackbar,
  onSnackbarClose,
  form,
}: Props) => {
  const { current_user, teachers, meta } = data;
  const canManage = current_user.teacher_permission.manage_other_teachers;

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
            教員権限管理
          </Typography>

          <Typography variant="body2" sx={{ color: colors.text.muted }}>
            {meta.total_count}件
          </Typography>
        </Box>

        <Button
          component={Link}
          href="/teacher/colleagues"
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
          教員一覧へ戻る
        </Button>
      </Box>

      {!canManage && (
        <Alert severity="info" sx={{ mb: 3 }}>
          権限を編集するには「他の教員操作権限」が必要です。
        </Alert>
      )}

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
                  <TableCell align="center">操作範囲</TableCell>
                  <TableCell align="center">他職員権限</TableCell>
                  <TableCell align="center">編集</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {teachers.map((teacher) => {
                  const isSelf = teacher.id === current_user.id;

                  return (
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
                        {isSelf && (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: colors.text.muted, ml: 1 }}
                          >
                            （自分）
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={
                            teacher.teacher_permission.grade_scope ===
                            "all_grades"
                              ? "全学年"
                              : "自学年"
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
                          size="small"
                          variant="outlined"
                          disabled={!canManage || isSelf}
                          onClick={() => onEditClick(teacher)}
                          sx={{
                            minWidth: 64,
                            height: 28,
                            px: 1.5,
                            fontSize: "0.75rem",
                            borderRadius: 1.5,
                            textTransform: "none",
                          }}
                        >
                          編集
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <PermissionEditDrawer
        teacher={editingTeacher}
        onClose={onDrawerClose}
        onUpdate={onUpdate}
        updating={updating}
        updateErrors={updateErrors}
        form={form}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={onSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={onSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

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
