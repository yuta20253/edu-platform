"use client";

import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";
import { colors } from "@/app/theme/colors";
import { radius } from "@/app/theme/studentTheme";
import { Course } from "@/types/tasks/course";
import { Unit } from "@/types/tasks/unit";
import { SubjectName } from "@/constants/subject";
import { AnalyticsFilters } from "./components/AnalyticsFilters";
import { AnalyticsType } from "./types";

const cardSx = {
  bgcolor: colors.surface.white,
  borderRadius: `${radius.md}px`,
  boxShadow: `0 1px 3px ${colors.shadow.footer}`,
} as const;

type Props = {
  type: AnalyticsType;
  setType: (type: AnalyticsType) => void;
  subject: SubjectName | null;
  setSubject: (subject: SubjectName) => void;
  courseId: number | null;
  setCourseId: (courseId: number) => void;
  unitId: number | null;
  setUnitId: (unitId: number) => void;
  courses: Course[] | null;
  units: Unit[];
  children: ReactNode;
};

export const Presenter = ({
  type,
  setType,
  subject,
  setSubject,
  courseId,
  setCourseId,
  unitId,
  setUnitId,
  courses,
  units,
  children,
}: Props) => {
  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, mt: 1, mb: 3 }}
      >
        学習分析
      </Typography>

      <Box sx={{ ...cardSx, p: 2, mb: 2 }}>
        <AnalyticsFilters
          type={type}
          setType={setType}
          subject={subject}
          setSubject={setSubject}
          courseId={courseId}
          setCourseId={setCourseId}
          unitId={unitId}
          setUnitId={setUnitId}
          courses={courses}
          units={units}
        />
      </Box>

      <Box sx={{ ...cardSx, p: 3, minHeight: 240 }}>{children}</Box>
    </Box>
  );
};
