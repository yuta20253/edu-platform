"use client";

import {
  Box,
  Button,
  Chip,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableCard } from "@/components/ui/TableCard";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { useToast } from "@/components/ui/ToastProvider";
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

const TABLE_COLUMNS = [
  "名前",
  "メール",
  "担当学年権限",
  "他教師管理",
  "担当学年",
] as const;

const gradeScopeLabel: Record<Teacher["grade_scope"], string> = {
  own_grade: "自学年",
  all_grades: "全学年",
};

export const TeachersTab = ({ schoolId }: Props) => {
  const { teachers, loading, error, refetch } = useFetchTeachers(schoolId);
  const { grades, error: gradesError } = useFetchGrades(schoolId);
  const toast = useToast();
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // 担当学年の選択肢が取れないままドロワーを開くと空のまま気づけないため通知する
  useEffect(() => {
    if (gradesError) {
      toast.show({ message: "学年の取得に失敗しました", severity: "error" });
    }
    // toast は安定した参照のため依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradesError]);

  const closeDrawer = () => {
    setDrawerMode(null);
    setEditingTeacher(null);
  };

  const { creating, createErrors, handleCreate } = useCreateTeacher({
    schoolId,
    onCreated: () => {
      closeDrawer();
      toast.show({ message: "保存しました" });
      refetch();
    },
  });

  const { updating, updateErrors, handleUpdate } = useUpdateTeacher({
    schoolId,
    teacherId: editingTeacher?.id ?? 0,
    onUpdated: () => {
      closeDrawer();
      toast.show({ message: "保存しました" });
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
    return (
      <TableCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {TABLE_COLUMNS.map((label) => (
                  <TableCell key={label}>{label}</TableCell>
                ))}
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableSkeleton rows={5} columns={TABLE_COLUMNS.length + 1} />
          </Table>
        </TableContainer>
      </TableCard>
    );
  }

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <Box>
      {teachers.length === 0 ? (
        <EmptyState
          message="教師がまだありません"
          action={
            <Button variant="contained" onClick={openCreateDrawer}>
              最初の教師を追加する
            </Button>
          }
        />
      ) : (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button variant="contained" onClick={openCreateDrawer}>
              教師を追加する
            </Button>
          </Box>
          <TableCard>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {TABLE_COLUMNS.map((label) => (
                      <TableCell key={label}>{label}</TableCell>
                    ))}
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>{teacher.name}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>
                        {gradeScopeLabel[teacher.grade_scope]}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={teacher.manage_other_teachers}
                          disabled
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {teacher.grades.map((grade) => (
                            <Chip
                              key={grade.id}
                              label={grade.name}
                              size="small"
                            />
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
            </TableContainer>
          </TableCard>
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
    </Box>
  );
};
