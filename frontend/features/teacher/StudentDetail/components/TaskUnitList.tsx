"use client";

import { colors } from "@/app/theme/colors";
import { buildCourseLabel } from "@/libs/domain/course/courseLabel";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { StudentTaskUnit } from "../types";
import { formatCorrectRate, getCorrectRateColor } from "./correctRate";

type Props = {
  units: StudentTaskUnit[];
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
    <Stack spacing={2}>
      {units.map((unit) => (
        <Box key={unit.id}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600}>
                {unit.unit_name}
              </Typography>
              <Typography variant="caption" sx={{ color: colors.text.muted }}>
                {buildCourseLabel(unit.course)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
              <Typography variant="body2">
                {unit.answered_count}/{unit.total_questions}問
              </Typography>
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ color: getCorrectRateColor(unit.correct_rate) }}
              >
                正答率 {formatCorrectRate(unit.correct_rate)}
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={unit.progress_rate}
            aria-label={`${unit.unit_name}の進捗`}
            sx={{ mt: 0.5, height: 6, borderRadius: 999 }}
          />
        </Box>
      ))}
    </Stack>
  );
};
