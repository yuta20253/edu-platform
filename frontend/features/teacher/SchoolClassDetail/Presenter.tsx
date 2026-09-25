"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { SchoolClassDetailType } from "./types";

type Props = {
  schoolClass: SchoolClassDetailType;
};

const ROLE_LABEL: Record<string, string> = {
  homeroom: "担任",
  assistant: "副担任",
};

export const Presenter = ({ schoolClass }: Props) => {
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          {schoolClass.grade.display_name} {schoolClass.name}
        </Typography>

        <Button
          component={Link}
          href="/teacher/school-classes"
          variant="outlined"
          size="small"
          sx={{
            height: 32,
            px: 2,
            textTransform: "none",
          }}
        >
          一覧へ戻る
        </Button>
      </Box>

      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="caption"
            sx={{ display: "block", mb: 1, color: colors.text.muted }}
          >
            担任・副担任
          </Typography>

          {schoolClass.teachers.length === 0 ? (
            <Typography variant="body2" sx={{ color: colors.text.muted }}>
              未設定
            </Typography>
          ) : (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {schoolClass.teachers.map((teacher) => (
                <Chip
                  key={teacher.id}
                  label={`${teacher.name}（${ROLE_LABEL[teacher.role] ?? teacher.role}）`}
                  size="small"
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mb: 1.5, color: colors.text.primary }}
      >
        在籍生徒（{schoolClass.students.length}名）
      </Typography>

      <Card
        elevation={0}
        sx={{
          width: "100%",
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <CardContent
          sx={{
            p: 0,
            "&:last-child": {
              pb: 0,
            },
          }}
        >
          <TableContainer sx={{ width: "100%" }}>
            <Table
              size="small"
              sx={{
                "& th, & td": {
                  py: 1.5,
                  px: 2,
                  verticalAlign: "middle",
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
                  <TableCell>氏名(カナ)</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {schoolClass.students.map((student) => (
                  <TableRow
                    key={student.id}
                    hover
                    sx={{ "&:last-child td": { borderBottom: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Link
                        href={`/teacher/students/${student.id}`}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {student.name}
                      </Link>
                    </TableCell>

                    <TableCell>{student.name_kana}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
