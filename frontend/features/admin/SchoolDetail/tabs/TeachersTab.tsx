"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Chip,
  Snackbar,
  Alert as MuiAlert,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import { useState } from "react";
import {
  TeacherDrawer,
  type TeacherFormValues,
} from "../components/TeacherDrawer";
import { useCreateTeacher } from "../hooks/useCreateTeacher";
import { useFetchGrades } from "../hooks/useFetchGrades";
import { useFetchTeachers } from "../hooks/useFetchTeachers";
import { useUpdateTeacher } from "../hooks/useUpdateTeacher";
import type { Teacher } from "../types";

type Props = {
  schoolId: number;
};

const gradeScopeLabel: Record<Teacher["grade_scope"], string> = {
  own_grade: "自学年",
  all_grades: "全学年",
};

export const TeachersTab = ({ schoolId }: Props) => {
  const { teachers, loading, refetch } = useFetchTeachers(schoolId);
  const { grades } = useFetchGrades(schoolId);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const closeDrawer = () => {
    setDrawerMode(null);
    setEditingTeacher(null);
  };

  const { creating, createErrors, handleCreate } = useCreateTeacher({
    schoolId,
    onCreated: () => {
      closeDrawer();
      setSnackbarOpen(true);
      refetch();
    },
  });

  const { updating, updateErrors, handleUpdate } = useUpdateTeacher({
    schoolId,
    teacherId: editingTeacher?.id ?? 0,
    onUpdated: () => {
      closeDrawer();
      setSnackbarOpen(true);
      refetch();
    },
  });

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditingTeacher(null);
  };

  const openEditDrawer = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setDrawerMode("edit");
  };

  const handleSubmit = (values: TeacherFormValues) => {
    if (drawerMode === "edit") {
      handleUpdate(values);
      return;
    }
    handleCreate(values);
  };

  if (loading) {
    return null;
  }

  return (
    <Box>
      {teachers.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 10,
            gap: 2,
          }}
        >
          <SchoolIcon sx={{ fontSize: 64, color: colors.text.muted }} />
          <Typography variant="h6" sx={{ color: colors.text.secondary }}>
            まだ教師が登録されていません
          </Typography>
          <Button variant="contained" onClick={openCreateDrawer}>
            最初の教師を追加する
          </Button>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button variant="contained" onClick={openCreateDrawer}>
              教師を追加する
            </Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>名前</TableCell>
                <TableCell>メール</TableCell>
                <TableCell>担当学年権限</TableCell>
                <TableCell>他教師管理</TableCell>
                <TableCell>担当学年</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{gradeScopeLabel[teacher.grade_scope]}</TableCell>
                  <TableCell>
                    <Switch checked={teacher.manage_other_teachers} disabled />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {teacher.grades.map((grade) => (
                        <Chip key={grade.id} label={grade.name} size="small" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => openEditDrawer(teacher)}
                    >
                      編集
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <TeacherDrawer
        open={drawerMode !== null}
        mode={drawerMode ?? "create"}
        onClose={closeDrawer}
        onSubmit={handleSubmit}
        submitting={drawerMode === "edit" ? updating : creating}
        submitErrors={drawerMode === "edit" ? updateErrors : createErrors}
        grades={grades}
        initialTeacher={editingTeacher}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
      >
        <MuiAlert severity="success" onClose={() => setSnackbarOpen(false)}>
          保存しました
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};
