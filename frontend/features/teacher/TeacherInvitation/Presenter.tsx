"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { UnsentTeacher } from "./types";

type Props = {
  teachers: UnsentTeacher[];
  loading: boolean;
  error: string | null;

  selectedTeacherIds: number[];
  submitting: boolean;
  submitError: string | null;
  successMessage: string | null;
  allSelected: boolean;

  onToggleTeacher: (teacherId: number) => void;
  onToggleAll: () => void;
  onSendInvites: () => void;
};

export const Presenter = ({
  teachers,
  loading,
  error,
  selectedTeacherIds,
  submitting,
  submitError,
  successMessage,
  allSelected,
  onToggleTeacher,
  onToggleAll,
  onSendInvites,
}: Props) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ color: colors.text.primary, mb: 2 }}
      >
        未招待教員一覧
      </Typography>

      <Card
        elevation={0}
        sx={{ border: `1px solid ${colors.border.light}`, borderRadius: 2 }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, color: colors.status.error }}>{error}</Box>
          ) : teachers.length === 0 ? (
            <Box sx={{ p: 3, color: colors.text.primary }}>
              現在、未招待の教員はいません。
            </Box>
          ) : (
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
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={
                          selectedTeacherIds.length > 0 && !allSelected
                        }
                        onChange={onToggleAll}
                      />
                    </TableCell>
                    <TableCell>氏名</TableCell>
                    <TableCell>氏名カナ</TableCell>
                    <TableCell>メール</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedTeacherIds.includes(teacher.id)}
                          onChange={() => onToggleTeacher(teacher.id)}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {teacher.name}
                      </TableCell>
                      <TableCell>{teacher.name_kana}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {(submitError ||
        successMessage ||
        selectedTeacherIds.length > 0 ||
        teachers.length > 0) && (
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          {submitError && (
            <Box sx={{ color: colors.status.error, fontWeight: 600 }}>
              {submitError}
            </Box>
          )}
          {successMessage && (
            <Box sx={{ color: colors.status.success, fontWeight: 600 }}>
              {successMessage}
            </Box>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="primary"
              disabled={
                selectedTeacherIds.length === 0 || submitting || loading
              }
              onClick={onSendInvites}
              sx={{
                minWidth: 160,
                height: 40,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {submitting ? "送信中..." : "選択した教員に招待を送信"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
