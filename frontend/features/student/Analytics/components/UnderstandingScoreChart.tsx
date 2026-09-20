import { Box, LinearProgress, Typography } from "@mui/material";
import { colors } from "@/app/theme/colors";
import { buildCourseLabel } from "@/libs/domain/course/courseLabel";
import { UnderstandingScoreData } from "../types";

type Props = {
  data: UnderstandingScoreData;
};

export const UnderstandingScoreChart = ({ data }: Props) => {
  if (data.subjects.length === 0) {
    return (
      <Typography sx={{ textAlign: "center", py: 4 }}>
        学習履歴がありません
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {data.subjects.map((subject) => (
        <Box key={subject.subject_name}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {subject.subject_name}
          </Typography>
          {subject.courses.map((course, courseIndex) => (
            <Box
              key={`${subject.subject_name}-${course.level_name}-${course.level_number}-${courseIndex}`}
              sx={{ mt: 2 }}
            >
              <Typography sx={{ mb: 1, fontWeight: "bold" }}>
                {buildCourseLabel(course)}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {course.units.map((unit) => (
                  <Box key={unit.unit_name}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Typography sx={{ fontSize: 14 }}>
                        {unit.unit_name}
                      </Typography>
                      <Typography sx={{ fontSize: 14, whiteSpace: "nowrap" }}>
                        {unit.score}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={unit.score}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.border.subtle,
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: colors.brand.primary,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};
