"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
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
  const { teachers, meta } = data;
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 3 }}>
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
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: colors.surface.light }}>
                  <TableCell sx={{ fontWeight: 600 }}>氏名</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>氏名カナ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>担当学年</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>学年操作範囲</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>他職員操作権限</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>詳細</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow
                    key={teacher.id}
                    hover
                    sx={{ "&:last-child td": { border: 0 } }}
                  >
                    <TableCell>{teacher.name}</TableCell>
                    <TableCell>{teacher.name_kana}</TableCell>
                    <TableCell>{teacher.grade.display_name}</TableCell>
                    <TableCell>
                      {teacher.teacher_permission.grade_scope
                        ? "自学年"
                        : "全学年"}
                    </TableCell>
                    <TableCell>
                      {teacher.teacher_permission.manage_other_teachers
                        ? "有"
                        : "無"}
                    </TableCell>
                    <TableCell>
                      <Button
                        component={Link}
                        href={`/teachers/colleagues/${teacher.id}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: "0.75rem" }}
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
      {meta.total_count > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Pagination
            count={meta.total_pages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};
