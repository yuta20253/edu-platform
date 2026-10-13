"use client";

import { colors } from "@/app/theme/colors";
import { buildCourseLabel } from "@/libs/domain/course/courseLabel";
import {
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { StudentTaskUnit } from "../types";
import { CorrectRateBadge } from "./CorrectRateBadge";

type Props = {
  units: StudentTaskUnit[];
};

const headCellSx = {
  color: colors.text.secondary,
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

export const TaskUnitList = ({ units }: Props) => {
  if (units.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
        紐づくUnitがありません
      </Typography>
    );
  }

  return (
    <TableContainer
      sx={{
        bgcolor: colors.surface.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 1.5,
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headCellSx}>Unit</TableCell>
            <TableCell sx={headCellSx}>コース</TableCell>
            <TableCell sx={headCellSx} align="right">
              解答数
            </TableCell>
            <TableCell sx={{ ...headCellSx, width: 200 }}>進捗</TableCell>
            <TableCell sx={headCellSx} align="center">
              正答率
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.id} sx={{ "&:last-child td": { border: 0 } }}>
              <TableCell sx={{ fontWeight: 600 }}>{unit.unit_name}</TableCell>
              <TableCell sx={{ color: colors.text.secondary }}>
                {buildCourseLabel(unit.course)}
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                {unit.answered_count}/{unit.total_questions}問
              </TableCell>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={unit.progress_rate}
                    aria-label={`${unit.unit_name}の進捗`}
                    sx={{ flex: 1, height: 6, borderRadius: 999 }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      width: 40,
                      textAlign: "right",
                      color: colors.text.secondary,
                    }}
                  >
                    {Math.round(unit.progress_rate)}%
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">
                <CorrectRateBadge rate={unit.correct_rate} size="small" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
