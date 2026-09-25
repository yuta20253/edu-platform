"use client";

import { colors } from "@/app/theme/colors";
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { Fragment } from "react";
import { GradeWithSchoolClasses } from "./types";

type Props = {
  data: GradeWithSchoolClasses[];
};

export const Presenter = ({ data }: Props) => {
  const totalCount = data.reduce(
    (sum, grade) => sum + grade.school_classes.length,
    0,
  );

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
          学級一覧
        </Typography>

        <Typography variant="body2" sx={{ color: colors.text.muted }}>
          {totalCount}件
        </Typography>
      </Box>

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
                  <TableCell>クラス名</TableCell>
                  <TableCell align="center">詳細</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {data.map((grade) =>
                  grade.school_classes.length === 0 ? null : (
                    <Fragment key={grade.id}>
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          sx={{
                            bgcolor: colors.surface.default,
                            fontWeight: 700,
                            color: colors.text.primary,
                          }}
                        >
                          {grade.display_name}
                        </TableCell>
                      </TableRow>

                      {grade.school_classes.map((schoolClass) => (
                        <TableRow
                          key={schoolClass.id}
                          hover
                          sx={{
                            transition: "background-color 0.15s ease",
                            "&:last-child td": {
                              borderBottom: 0,
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600 }}>
                            {schoolClass.name}
                          </TableCell>

                          <TableCell align="center">
                            <Button
                              component={Link}
                              href={`/teacher/school-classes/${schoolClass.id}`}
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
                    </Fragment>
                  ),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
