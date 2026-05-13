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
import { StudentsData } from "./types";

type Props = {
  data: StudentsData;
  page: number;
  onPageChange: (page: number) => void;
};

export const Presenter = ({ data, page, onPageChange }: Props) => {
  const { students, meta } = data;

  return (
    <Box sx={{ p: 3, width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          width: "100%",
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ color: colors.text.primary }}
        >
          生徒一覧
        </Typography>

        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          {meta.total_count}件
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{
          width: "100%",
          border: `1px solid ${colors.border.light}`,
          borderRadius: 2,
          overflow: "hidden",
          mb: 3,
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
                minWidth: 700,
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
                  <TableCell>氏名カナ</TableCell>
                  <TableCell>学年</TableCell>
                  <TableCell align="center">詳細</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {students.map((student) => (
                  <TableRow
                    key={student.id}
                    hover
                    sx={{
                      transition: "background-color 0.15s ease",
                      "&:last-child td": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      {student.name}
                    </TableCell>

                    <TableCell>{student.name_kana}</TableCell>

                    <TableCell>{student.grade.display_name}</TableCell>

                    <TableCell align="center">
                      <Button
                        component={Link}
                        href={`/teacher/students/${student.id}`}
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
            width: "100%",
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
